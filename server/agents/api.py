"""
API FastAPI - Pipeline Real de Generación de Video
Integra: ElevenLabs (voz), Runway ML / Kling AI (video), OpenAI/LangChain (guion)
"""
import sys
# Forzar UTF-8 en Windows para evitar UnicodeEncodeError con emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
from pathlib import Path
import os
import asyncio
import time
import json
import httpx
import jwt
from dotenv import load_dotenv

load_dotenv()

# ── Configuración de APIs ────────────────────────────────────────────────────
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
KLING_API_KEY      = os.getenv("KLING_API_KEY", "")
KLING_API_SECRET   = os.getenv("KLING_API_SECRET", "")
KLING_BASE_URL     = "https://api.klingai.com"
RUNWAY_API_KEY     = os.getenv("RUNWAY_API_KEY", "")
RUNWAY_BASE_URL    = "https://api.dev.runwayml.com/v1"
RUNWAY_MODEL       = "gen4.5"   # gen4.5 | gen3a_turbo | veo3.1_fast
OPENAI_API_KEY     = os.getenv("OPENAI_API_KEY", "")

# Directorio para archivos generados (audios locales)
GENERATED_DIR = Path("generated_files")
GENERATED_DIR.mkdir(exist_ok=True)

# ── LLM (opcional) ──────────────────────────────────────────────────────────
llm = None
screenwriter = None
prompt_engineer = None

if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key":
    try:
        from langchain_openai import ChatOpenAI
        from server.agents.screenwriter import ScreenwriterAgent
        from server.agents.prompt_engineer import PromptEngineerAgent
        llm = ChatOpenAI(model="gpt-4-turbo", temperature=0.7, api_key=OPENAI_API_KEY)
        screenwriter = ScreenwriterAgent(llm)
        prompt_engineer = PromptEngineerAgent(llm)
        print("✅ LLM inicializado con OpenAI")
    except Exception as e:
        print(f"⚠️  LLM no disponible: {e}")
else:
    print("ℹ️  OPENAI_API_KEY no configurado — usando modo demo para guion")

# ── App FastAPI ──────────────────────────────────────────────────────────────
app = FastAPI(title="Story Video Generator API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Estado de pipelines ──────────────────────────────────────────────────────
pipeline_status: Dict[int, Dict] = {}

# ── Modelos Pydantic ─────────────────────────────────────────────────────────
class PipelineRequest(BaseModel):
    project_id: int
    user_idea: str
    num_clips: int = 5
    clip_duration: int = 60
    reference_image: Optional[str] = None

class StoryRequest(BaseModel):
    user_idea: str
    num_clips: int = 5
    clip_duration: int = 10
    reference_image: Optional[str] = None

# ── Helpers de estado ────────────────────────────────────────────────────────
def _init_status(project_id: int):
    pipeline_status[project_id] = {
        "project_id": project_id,
        "status": "in_progress",
        "overall_progress": 0,
        "current_stage": "screenwriting",
        "message": "Iniciando pipeline multi-agente...",
        "stages": {
            "screenwriting":      {"status": "pending", "progress": 0},
            "prompt_engineering": {"status": "pending", "progress": 0},
            "storyboard":         {"status": "pending", "progress": 0},
            "narration":          {"status": "pending", "progress": 0},
            "video":              {"status": "pending", "progress": 0},
            "assembly":           {"status": "pending", "progress": 0},
        },
        "result": None,
        "error": None,
        "clips": [],
        "audio_files": [],
        "video_files": [],
        "logs": [],
    }

def _set_stage(project_id: int, stage: str, progress: int, message: str):
    if project_id not in pipeline_status:
        _init_status(project_id)
    s = pipeline_status[project_id]
    s["overall_progress"] = progress
    s["current_stage"] = stage
    s["message"] = message
    s["status"] = "in_progress"
    if stage in s["stages"]:
        s["stages"][stage]["status"] = "in_progress"
        s["stages"][stage]["progress"] = progress

def _complete_stage(project_id: int, stage: str):
    s = pipeline_status.get(project_id, {})
    if stage in s.get("stages", {}):
        s["stages"][stage]["status"] = "completed"
        s["stages"][stage]["progress"] = 100

def _add_log(project_id: int, message: str):
    import datetime
    if project_id in pipeline_status:
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        entry = f"[{ts}] {message}"
        print(entry)
        logs = pipeline_status[project_id].setdefault("logs", [])
        logs.append(entry)
        pipeline_status[project_id]["logs"] = logs[-50:]

# ── ElevenLabs + gTTS fallback ───────────────────────────────────────────────
async def _tts_elevenlabs(text: str, project_id: int, scene_num: int) -> Optional[str]:
    """Intenta generar audio con ElevenLabs."""
    voice_id = "21m00Tcm4TlvDq8ikWAM"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text[:2000],
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(url, json=payload, headers=headers)
    if r.status_code == 200:
        filename = f"p{project_id}_scene{scene_num}_narration.mp3"
        (GENERATED_DIR / filename).write_bytes(r.content)
        return f"/api/python/files/{filename}"
    error_detail = r.text[:200]
    _add_log(project_id, f"ElevenLabs HTTP {r.status_code}: {error_detail[:100]} — usando gTTS")
    return None

def _tts_gtts_sync(text: str, filepath: str, lang: str = "es") -> bool:
    """Genera audio con gTTS (síncrono — se ejecuta en thread pool)."""
    try:
        from gtts import gTTS
        tts = gTTS(text=text[:500], lang=lang, slow=False)
        tts.save(filepath)
        return True
    except Exception as e:
        print(f"❌ gTTS error: {e}")
        return False

async def elevenlabs_tts(text: str, project_id: int, scene_num: int) -> Optional[str]:
    """
    Genera narración: intenta ElevenLabs primero, cae en gTTS si falla.
    gTTS es gratuito y no requiere API key.
    """
    filename = f"p{project_id}_scene{scene_num}_narration.mp3"
    filepath = str(GENERATED_DIR / filename)
    audio_route = f"/api/python/files/{filename}"

    # Intento 1: ElevenLabs (alta calidad)
    if ELEVENLABS_API_KEY:
        try:
            result = await _tts_elevenlabs(text, project_id, scene_num)
            if result:
                _add_log(project_id, f"ElevenLabs escena {scene_num}: OK ✅")
                return result
        except Exception as e:
            _add_log(project_id, f"ElevenLabs excepción: {str(e)[:80]}")

    # Intento 2: gTTS (gratuito, buena calidad en español)
    _add_log(project_id, f"gTTS escena {scene_num}: generando...")
    ok = await asyncio.to_thread(_tts_gtts_sync, text, filepath, "es")
    if ok:
        _add_log(project_id, f"gTTS escena {scene_num}: OK ✅ ({filename})")
        return audio_route

    _add_log(project_id, f"Audio escena {scene_num}: todos los métodos fallaron")
    return None


# ── Kling AI ─────────────────────────────────────────────────────────────────
def _kling_jwt() -> str:
    """Genera JWT para autenticación en Kling AI."""
    now = int(time.time())
    payload = {"iss": KLING_API_KEY, "exp": now + 1800, "nbf": now - 5}
    return jwt.encode(payload, KLING_API_SECRET, algorithm="HS256")

async def kling_generate_video(prompt: str, project_id: int, scene_num: int, duration_sec: int = 5) -> Optional[str]:
    """Crea un clip de video con Kling AI y retorna la URL del video."""
    if not KLING_API_KEY or not KLING_API_SECRET:
        print("⚠️  Kling AI: credenciales no configuradas")
        return None

    token = _kling_jwt()
    duration_str = "10" if duration_sec >= 10 else "5"

    create_payload = {
        "model_name": "kling-v1",
        "prompt": prompt[:2500],
        "negative_prompt": "blur, distort, low quality, watermark, nsfw",
        "cfg_scale": 0.5,
        "mode": "std",
        "aspect_ratio": "16:9",
        "duration": duration_str,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{KLING_BASE_URL}/v1/videos/text2video",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=create_payload,
            )

        if r.status_code != 200:
            error_detail = r.text[:300]
            print(f"\u274c Kling create error {r.status_code}: {error_detail}")
            _add_log(project_id, f"Kling error {r.status_code}: {error_detail[:120]}")
            return None

        task_id = r.json().get("data", {}).get("task_id")
        if not task_id:
            print(f"❌ Kling: no task_id en respuesta: {r.text[:200]}")
            return None

        print(f"🎬 Kling task_id={task_id} — polling...")

        # Polling hasta 8 minutos
        for attempt in range(96):  # 96 × 5s = 8 min
            await asyncio.sleep(5)
            token = _kling_jwt()  # refresh token
            async with httpx.AsyncClient(timeout=30.0) as client:
                sr = await client.get(
                    f"{KLING_BASE_URL}/v1/videos/text2video/{task_id}",
                    headers={"Authorization": f"Bearer {token}"},
                )
            if sr.status_code != 200:
                continue
            data = sr.json().get("data", {})
            task_status = data.get("task_status", "")

            if task_status == "succeed":
                videos = data.get("task_result", {}).get("videos", [])
                if videos:
                    video_url = videos[0].get("url", "")
                    print(f"✅ Kling escena {scene_num}: {video_url}")
                    return video_url
                return None

            if task_status == "failed":
                msg = data.get("task_status_msg", "desconocido")
                print(f"❌ Kling task failed: {msg}")
                return None

            print(f"  ⏳ Kling escena {scene_num} attempt {attempt+1}: {task_status}")

        print(f"⏰ Kling timeout escena {scene_num}")
        return None

    except Exception as e:
        print(f"❌ Kling excepción: {e}")
        return None

# ── Runway ML ──────────────────────────────────────────────────────────────────
async def runway_generate_video(prompt: str, project_id: int, scene_num: int, duration_sec: int = 5) -> Optional[str]:
    """Genera un clip de video con Runway ML Gen-4.5 y retorna la URL."""
    if not RUNWAY_API_KEY:
        return None

    # Runway max: 5 o 10 segundos
    duration = 10 if duration_sec >= 10 else 5
    headers = {
        "Authorization": f"Bearer {RUNWAY_API_KEY}",
        "X-Runway-Version": "2024-11-06",
        "Content-Type": "application/json",
    }

    try:
        # Paso 1: Crear tarea de generación
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{RUNWAY_BASE_URL}/text_to_video",
                headers=headers,
                json={
                    "promptText": prompt[:2000],
                    "model": RUNWAY_MODEL,
                    "ratio": "1280:720",
                    "duration": duration,
                },
            )

        if r.status_code not in (200, 201):
            err = r.text[:200]
            print(f"❌ Runway create {r.status_code}: {err}")
            _add_log(project_id, f"Runway error {r.status_code}: {err[:100]}")
            return None

        task_id = r.json().get("id") or r.json().get("taskId")
        if not task_id:
            _add_log(project_id, f"Runway: sin task_id en respuesta")
            return None

        _add_log(project_id, f"Runway escena {scene_num}: task {task_id[:16]}... polling")

        # Paso 2: Polling hasta 8 minutos
        for attempt in range(96):  # 96 × 5s = 8 min
            await asyncio.sleep(5)
            async with httpx.AsyncClient(timeout=30.0) as client:
                sr = await client.get(
                    f"{RUNWAY_BASE_URL}/tasks/{task_id}",
                    headers=headers,
                )
            if sr.status_code != 200:
                continue

            task = sr.json()
            status = task.get("status", "")

            if status == "SUCCEEDED":
                outputs = task.get("output", [])
                if outputs:
                    url = outputs[0]
                    print(f"✅ Runway escena {scene_num}: {url}")
                    _add_log(project_id, f"Runway escena {scene_num}: OK ✅")
                    return url
                return None

            if status == "FAILED":
                err = task.get("failure", "") or task.get("failureCode", "")
                print(f"❌ Runway task failed: {err}")
                _add_log(project_id, f"Runway escena {scene_num} fallo: {str(err)[:80]}")
                return None

            if attempt % 6 == 0:  # log cada 30s
                _add_log(project_id, f"Runway escena {scene_num}: {status} (intento {attempt+1})")

        _add_log(project_id, f"Runway escena {scene_num}: timeout")
        return None

    except Exception as e:
        print(f"❌ Runway excepción: {e}")
        _add_log(project_id, f"Runway excepción: {str(e)[:80]}")
        return None

def _create_local_video(text: str, filepath: str, duration: int = 5):
    """Genera un video local simple usando imageio y Pillow.
    Ahora usa pollinations.ai para obtener una imagen generada por IA gratis.
    """
    try:
        import imageio
        from PIL import Image, ImageDraw
        import numpy as np
        import urllib.request
        import urllib.parse
        import os

        # Intentar obtener imagen de pollinations.ai
        # Usamos los primeros 50 caracteres del prompt para no romper la URL
        safe_prompt = urllib.parse.quote(text[:100])
        image_url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width=1280&height=720&nologo=true"
        
        try:
            req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                bg_img = Image.open(response).convert('RGB')
        except Exception as e:
            print(f"⚠️ Fallo al obtener imagen de pollinations: {e}")
            bg_img = Image.new('RGB', (1280, 720), color=(30, 30, 40))

        fps = 24
        frames = duration * fps
        writer = imageio.get_writer(filepath, fps=fps, macro_block_size=1)

        for i in range(frames):
            # Clonar la imagen base para este frame
            img = bg_img.copy()
            draw = ImageDraw.Draw(img)
            
            # Oscurecer ligeramente un cuadro para el texto
            draw.rectangle([(50, 600), (1230, 700)], fill=(0, 0, 0, 150))
            
            # Dibujar texto (subtítulos)
            display_text = text[:100] + "..." if len(text) > 100 else text
            draw.text((70, 620), display_text, fill=(255, 255, 255))
            draw.text((70, 660), f"Fallback Gratuito - Escena de {duration}s - Frame: {i+1}/{frames}", fill=(200, 200, 200))
            
            # Animar ligeramente la imagen (simular paneo/zoom leve si se desea, pero mantenerlo simple por velocidad)
            writer.append_data(np.array(img))
            
        writer.close()
        return "OK"
    except Exception as e:
        print(f"❌ Local video error: {e}")
        return str(e)

def _merge_video_audio(video_path: str, audio_path: str, output_path: str) -> bool:
    """Usa ffmpeg (vía imageio_ffmpeg) para unir un video y un audio."""
    try:
        import imageio_ffmpeg
        import subprocess
        import os

        if not os.path.exists(video_path) or not os.path.exists(audio_path):
            return False

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
        cmd = [
            ffmpeg_exe,
            "-y", # Sobrescribir
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            return True
        else:
            print(f"❌ FFmpeg merge error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ FFmpeg exception: {e}")
        return False

async def generate_video_clip(prompt: str, project_id: int, scene_num: int, duration_sec: int = 5) -> Optional[str]:
    """Intenta Runway ML primero, luego Kling AI, luego fallback local."""
    # Intento 1: Runway ML
    if RUNWAY_API_KEY:
        _add_log(project_id, f"Video escena {scene_num}: probando Runway {RUNWAY_MODEL}...")
        url = await runway_generate_video(prompt, project_id, scene_num, duration_sec)
        if url:
            return url
        _add_log(project_id, f"Video escena {scene_num}: Runway falló, probando Kling...")

    # Intento 2: Kling AI
    if KLING_API_KEY and KLING_API_SECRET:
        url = await kling_generate_video(prompt, project_id, scene_num, duration_sec)
        if url:
            return url
        _add_log(project_id, f"Video escena {scene_num}: Kling falló, probando generador local...")

    # Intento 3: Fallback Local Gratuito (imageio)
    _add_log(project_id, f"Video escena {scene_num}: generando video local (fallback gratuito)...")
    filename = f"p{project_id}_scene{scene_num}_video.mp4"
    filepath = str(GENERATED_DIR / filename)
    
    # Generamos de la duración exacta solicitada
    res = await asyncio.to_thread(_create_local_video, prompt, filepath, duration_sec)
    if res == "OK":
        _add_log(project_id, f"Video local escena {scene_num}: OK ✅ ({filename})")
        return f"/api/python/files/{filename}"

    _add_log(project_id, f"Video escena {scene_num} fallback error: {str(res)[:80]}")
    _add_log(project_id, f"Video escena {scene_num}: todos los proveedores fallaron")
    return None


# ── Generador de historia mock ───────────────────────────────────────────────
def _mock_story(user_idea: str, num_clips: int, clip_duration: int) -> dict:
    scenes = []
    templates = [
        "Un personaje misterioso aparece en {place}, cargando el peso de un secreto.",
        "La verdad comienza a emerger cuando {event} altera el equilibrio de todo.",
        "Una decisión crucial divide los caminos, todo depende del próximo momento.",
        "El clímax se acerca; las fuerzas opuestas se confrontan sin retorno.",
        "El desenlace revela lo que siempre estuvo oculto, cambiando todo para siempre.",
    ]
    places = ["una ciudad neon-noir", "un laboratorio abandonado", "el horizonte digital", "una sala sin ventanas"]
    events = ["un mensaje encriptado llega", "el sistema colapsa", "la memoria falla", "el tiempo se detiene"]
    
    for i in range(num_clips):
        t = templates[i % len(templates)]
        desc = t.format(
            place=places[i % len(places)],
            event=events[i % len(events)],
        )
        scenes.append({
            "scene_id": i + 1,
            "title": f"Escena {i + 1}: {user_idea[:30]}...",
            "description": desc,
            "dialogue": f"Narración escena {i + 1}: {desc}",
            "visual_elements": ["neon lights", "cinematic depth", "dramatic shadows"],
            "mood": "neon-noir cinematographic",
            "duration_seconds": clip_duration,
            "video_prompt": f"Cinematic neon-noir shot: {desc}. Ultra HD, dramatic lighting, film grain.",
        })
    return {
        "title": f"Historia: {user_idea[:50]}",
        "synopsis": user_idea[:300],
        "scenes": scenes,
        "total_duration": num_clips * clip_duration,
    }

# ── Pipeline Principal ───────────────────────────────────────────────────────
async def run_pipeline(
    project_id: int,
    user_idea: str,
    num_clips: int,
    clip_duration: int,
    reference_image: Optional[str],
):
    try:
        # ── Etapa 1: Guionista ──────────────────────────────────────────────
        _set_stage(project_id, "screenwriting", 5, "Agente Guionista generando historia...")

        story = None
        if screenwriter:
            try:
                # asyncio.to_thread evita bloquear el event loop con la llamada síncrona a OpenAI
                story = await asyncio.to_thread(
                    screenwriter.create_story,
                    user_idea, num_clips, clip_duration, reference_image
                )
                print("✅ Screenwriter (OpenAI) completado")
                _add_log(project_id, "Guionista: historia generada con OpenAI")
            except Exception as e:
                print(f"⚠️  Screenwriter error: {e} — usando mock")
                _add_log(project_id, f"Guionista: fallback a modo demo ({e})")

        if not story:
            await asyncio.sleep(1)
            story = _mock_story(user_idea, num_clips, clip_duration)
            _add_log(project_id, "Guionista: historia generada en modo demo")

        _complete_stage(project_id, "screenwriting")

        # ── Etapa 2: Prompt Engineering ────────────────────────────────────
        _set_stage(project_id, "prompt_engineering", 20, "Optimizando prompts para cada escena...")

        scenes = story.get("scenes", [])
        # Enriquecer prompts para Kling
        for s in scenes:
            if "video_prompt" not in s:
                s["video_prompt"] = (
                    f"Cinematic neon-noir: {s.get('description', '')}. "
                    f"Mood: {s.get('mood', 'dramatic')}. 4K, film grain, deep shadows."
                )

        await asyncio.sleep(1)
        _complete_stage(project_id, "prompt_engineering")

        # ── Etapa 3: Storyboard (placeholder) ─────────────────────────────
        _set_stage(project_id, "storyboard", 35, "Generando storyboard visual...")
        await asyncio.sleep(1)
        _complete_stage(project_id, "storyboard")

        # ── Etapa 4: Narración (ElevenLabs) ──────────────────────────────
        _set_stage(project_id, "narration", 45, "Generando narración con ElevenLabs...")

        audio_files = []
        if ELEVENLABS_API_KEY:
            for i, scene in enumerate(scenes):
                narr_text = scene.get("dialogue") or scene.get("description", "")
                _set_stage(
                    project_id, "narration",
                    45 + int((i / max(len(scenes), 1)) * 15),
                    f"ElevenLabs: narración escena {i+1}/{len(scenes)}..."
                )
                _add_log(project_id, f"ElevenLabs: iniciando escena {i+1}/{len(scenes)}")
                audio_url = await elevenlabs_tts(narr_text, project_id, i + 1)
                status_msg = "OK" if audio_url else "FALLO"
                _add_log(project_id, f"ElevenLabs escena {i+1}: {status_msg}")
                audio_files.append({"scene": i + 1, "url": audio_url, "text": narr_text[:100]})
        else:
            await asyncio.sleep(1)
            _add_log(project_id, "ElevenLabs: no configurado — omitido")

        pipeline_status[project_id]["audio_files"] = audio_files
        _complete_stage(project_id, "narration")

        # ── Etapa 5: Video (Runway ML → Kling fallback) ────────────────────
        provider = "Runway ML" if RUNWAY_API_KEY else "Kling AI"
        _set_stage(project_id, "video", 62, f"Generando clips de video con {provider}...")

        video_files = []
        if RUNWAY_API_KEY or (KLING_API_KEY and KLING_API_SECRET):
            for i, scene in enumerate(scenes):
                _set_stage(
                    project_id, "video",
                    62 + int((i / max(len(scenes), 1)) * 25),
                    f"{provider}: generando clip {i+1}/{len(scenes)}..."
                )
                clip_url = await generate_video_clip(
                    scene.get("video_prompt", scene.get("description", "")),
                    project_id, i + 1,
                    clip_duration,
                )
                video_files.append({
                    "scene": i + 1, "url": clip_url,
                    "title": scene.get("title", f"Escena {i+1}"),
                    "prompt": scene.get("video_prompt", "")[:100],
                })
        else:
            await asyncio.sleep(1)
            _add_log(project_id, "Video: sin proveedor configurado (Runway/Kling)")

        pipeline_status[project_id]["video_files"] = video_files
        _complete_stage(project_id, "video")

        # ── Etapa 6: Ensamblaje ────────────────────────────────────────────
        _set_stage(project_id, "assembly", 90, "Ensamblando audios y videos...")
        
        clips_generated = []
        for i in range(num_clips):
            scene_info = scenes[i] if i < len(scenes) else {}
            v_url = video_files[i]["url"] if i < len(video_files) else None
            a_url = audio_files[i]["url"] if i < len(audio_files) else None
            
            combined_url = v_url
            if v_url and a_url:
                try:
                    _add_log(project_id, f"Ensamblaje: uniendo audio y video escena {i+1}...")
                    
                    v_filename = v_url.split("/")[-1]
                    a_filename = a_url.split("/")[-1]
                    v_local = str(GENERATED_DIR / v_filename)
                    a_local = str(GENERATED_DIR / a_filename)
                    out_filename = f"p{project_id}_scene{i+1}_combined.mp4"
                    out_local = str(GENERATED_DIR / out_filename)
                    
                    ok = await asyncio.to_thread(_merge_video_audio, v_local, a_local, out_local)
                    if ok:
                        combined_url = f"/api/python/files/{out_filename}"
                        _add_log(project_id, f"Ensamblaje escena {i+1}: OK ✅")
                    else:
                        _add_log(project_id, f"Ensamblaje escena {i+1}: Falló, dejando video sin audio")
                except Exception as e:
                    _add_log(project_id, f"Ensamblaje error: {str(e)[:80]}")

            clips_generated.append({
                "scene": i + 1,
                "title": scene_info.get("title", f"Escena {i+1}"),
                "video_url": combined_url,
                "audio_url": a_url,
            })

        _complete_stage(project_id, "assembly")

        pipeline_status[project_id].update({
            "status": "completed",
            "overall_progress": 100,
            "message": f"¡Pipeline completado! {len([c for c in clips_generated if c['video_url']])} clips generados.",
            "result": {
                "story_title": story.get("title", ""),
                "synopsis": story.get("synopsis", "")[:300],
                "scenes_count": num_clips,
                "clips": clips_generated,
                "has_audio": any(c["audio_url"] for c in clips_generated),
                "has_video": any(c["video_url"] for c in clips_generated),
            },
            "clips": clips_generated,
        })

    except Exception as e:
        import traceback
        print(f"❌ Pipeline error: {traceback.format_exc()}")
        pipeline_status[project_id].update({
            "status": "failed",
            "error": str(e),
            "message": f"Error en el pipeline: {str(e)}",
        })

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Story Video Generator API",
        "version": "2.0.0",
        "apis": {
            "elevenlabs": bool(ELEVENLABS_API_KEY),
            "runway": bool(RUNWAY_API_KEY),
            "kling_ai": bool(KLING_API_KEY and KLING_API_SECRET),
            "openai": bool(llm),
        },
        "video_provider": "Runway ML" if RUNWAY_API_KEY else ("Kling AI" if KLING_API_KEY else "none"),
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "elevenlabs": bool(ELEVENLABS_API_KEY),
        "runway": bool(RUNWAY_API_KEY),
        "runway_model": RUNWAY_MODEL if RUNWAY_API_KEY else None,
        "kling": bool(KLING_API_KEY and KLING_API_SECRET),
        "llm": bool(llm),
    }

@app.get("/files/{filename}")
async def serve_file(filename: str):
    """Sirve archivos generados (audios de ElevenLabs, etc.)."""
    safe_name = Path(filename).name  # evitar path traversal
    file_path = GENERATED_DIR / safe_name
    if file_path.exists():
        return FileResponse(str(file_path))
    raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {filename}")

@app.post("/start-pipeline")
async def start_pipeline(request: PipelineRequest, background_tasks: BackgroundTasks):
    """Inicia el pipeline completo en background."""
    project_id = request.project_id
    _init_status(project_id)
    background_tasks.add_task(
        run_pipeline,
        project_id=project_id,
        user_idea=request.user_idea,
        num_clips=request.num_clips,
        clip_duration=request.clip_duration,
        reference_image=request.reference_image,
    )
    return {
        "status": "started",
        "project_id": project_id,
        "apis_active": {
            "elevenlabs": bool(ELEVENLABS_API_KEY),
            "kling": bool(KLING_API_KEY and KLING_API_SECRET),
        },
    }

@app.get("/pipeline-status/{project_id}")
async def pipeline_status_endpoint(project_id: int):
    """Estado actual del pipeline."""
    if project_id not in pipeline_status:
        return {
            "project_id": project_id,
            "status": "not_started",
            "overall_progress": 0,
            "message": "Pipeline no iniciado",
            "stages": {},
            "clips": [],
        }
    return pipeline_status[project_id]

@app.post("/generate-story")
async def generate_story_endpoint(request: StoryRequest):
    """Genera solo el guion (sin pipeline completo)."""
    if screenwriter:
        try:
            story = screenwriter.create_story(
                request.user_idea, request.num_clips,
                request.clip_duration, request.reference_image,
            )
            return {"status": "success", "data": story}
        except Exception as e:
            pass
    story = _mock_story(request.user_idea, request.num_clips, request.clip_duration)
    return {"status": "success", "mode": "demo", "data": story}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
