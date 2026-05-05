# Story Video Generator - Arquitectura del Sistema Multi-Agente

## 1. Visión General del Sistema

La plataforma **Story Video Generator** es un sistema de generación automática de contenido videocinematográfico que utiliza una arquitectura multi-agente basada en **CrewAI**. El sistema orquesta múltiples agentes especializados para transformar una idea, guion o imagen de referencia en una serie de clips de video coherentes, con narración sincronizada y una estética visual consistente.

### Flujo de Generación de Alto Nivel

```
Entrada del Usuario
    ↓
[Agente Guionista] → Historia estructurada + Escenas
    ↓
[Agente Prompt Engineer] → Prompts técnicos optimizados
    ↓
[Generador de Imágenes] → Storyboard visual (previsualizaciones)
    ↓
[Narrador (ElevenLabs)] → Voice-over por escena
    ↓
[Generador de Video] → Clips individuales
    ↓
[Ensamblador] → Video final completo
    ↓
Salida: Video + Metadatos + Historial
```

---

## 2. Arquitectura Multi-Agente con CrewAI

### 2.1 Componentes Principales

| Componente | Responsabilidad | Entrada | Salida |
|---|---|---|---|
| **Agente Guionista** | Generar historia estructurada y dividir en escenas | Idea/Guion/Imagen referencia | JSON con escenas, diálogos, descripciones visuales |
| **Agente Prompt Engineer** | Convertir escenas en prompts técnicos para IA | Escenas del Guionista | Prompts optimizados para generación de imágenes/video |
| **Generador de Imágenes** | Crear previsualizaciones visuales de cada escena | Prompts técnicos | URLs de imágenes de storyboard |
| **Narrador (ElevenLabs)** | Generar voice-over coherente y sincronizado | Diálogos y descripciones | URLs de archivos de audio |
| **Generador de Video** | Crear clips de video individuales | Prompts técnicos + Imagen referencia | URLs de clips de video |
| **Ensamblador** | Sincronizar audio y video, generar video final | Clips + Audio | URL del video final completo |

### 2.2 Especificaciones de Agentes

#### **Agente Guionista (Screenwriter Agent)**

```yaml
Nombre: Screenwriter
Rol: Escritor de historias cinematográficas
Objetivo: Generar una historia coherente dividida en escenas individuales
Herramientas:
  - story_generator: LLM para crear narrativas
  - scene_divider: Dividir historia en beats/escenas
  
Entrada:
  - user_idea: string (idea o guion inicial)
  - reference_image: url (opcional, para contexto visual)
  - num_clips: integer (número de escenas deseadas)
  - clip_duration: integer (duración en segundos)

Salida:
  {
    "title": "string",
    "synopsis": "string",
    "scenes": [
      {
        "scene_id": 1,
        "title": "string",
        "description": "string",
        "dialogue": "string",
        "visual_elements": ["string"],
        "mood": "string",
        "duration_seconds": integer
      }
    ]
  }
```

#### **Agente Prompt Engineer (Prompt Engineer Agent)**

```yaml
Nombre: PromptEngineer
Rol: Ingeniero de prompts para generación de IA
Objetivo: Optimizar prompts técnicos para máxima calidad visual
Herramientas:
  - prompt_optimizer: Refinar prompts para APIs de IA
  - style_consistency: Asegurar coherencia visual entre escenas
  
Entrada:
  - scenes: array (salida del Agente Guionista)
  - reference_image: url (para mantener consistencia)
  - visual_style: string (ej: "neon-noir cinematographic")

Salida:
  {
    "optimized_scenes": [
      {
        "scene_id": 1,
        "video_prompt": "string (detallado para generación de video)",
        "image_prompt": "string (para storyboard preview)",
        "style_parameters": {
          "lighting": "string",
          "color_palette": "string",
          "composition": "string",
          "camera_movement": "string"
        }
      }
    ]
  }
```

### 2.3 Orquestación del Pipeline

El pipeline se ejecuta en las siguientes etapas:

**Etapa 1: Análisis y Estructura**
- Recibir entrada del usuario (idea, guion, imagen)
- Ejecutar Agente Guionista para generar escenas
- Guardar resultado en base de datos con estado `STRUCTURED`

**Etapa 2: Optimización de Prompts**
- Ejecutar Agente Prompt Engineer
- Generar prompts técnicos optimizados
- Guardar prompts en base de datos con estado `PROMPTS_GENERATED`

**Etapa 3: Generación de Storyboard**
- Generar imágenes de previsualización para cada escena
- Guardar URLs de imágenes con estado `STORYBOARD_GENERATED`
- Permitir que el usuario revise antes de continuar

**Etapa 4: Generación de Narración**
- Llamar API de ElevenLabs para cada escena
- Generar voice-over coherente
- Guardar URLs de audio con estado `NARRATION_GENERATED`

**Etapa 5: Generación de Video**
- Generar clips de video individuales
- Mantener consistencia visual mediante imagen de referencia
- Guardar URLs de clips con estado `VIDEO_GENERATED`

**Etapa 6: Ensamblaje Final**
- Sincronizar audio y video
- Generar video final completo
- Guardar URL final con estado `COMPLETED`
- **Disparar notificación automática al propietario**

---

## 3. Integración de APIs Externas

### 3.1 ElevenLabs API - Generación de Narración

```python
# Configuración
ELEVENLABS_API_KEY: str
ELEVENLABS_VOICE_ID: str (ej: "21m00Tcm4TlvDq8ikWAM")

# Endpoint
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}

# Parámetros
{
  "text": "Diálogo o narración de la escena",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}

# Respuesta
{
  "audio_url": "https://...",
  "duration_ms": 5000
}
```

### 3.2 Generación de Imágenes - Storyboard Preview

```python
# Usar API de generación de imágenes integrada en Manus
# (generateImage helper disponible en server/_core/imageGeneration.ts)

# Parámetros
{
  "prompt": "Prompt técnico del Agente Prompt Engineer",
  "style": "cinematographic neon-noir",
  "aspect_ratio": "16:9"
}

# Respuesta
{
  "url": "/manus-storage/...",
  "key": "unique-storage-key"
}
```

### 3.3 Generación de Video (Placeholder para Kling/Similar)

```python
# Configuración para futura integración con Kling API
KLING_API_KEY: str
KLING_API_URL: str

# Endpoint (ejemplo)
POST https://api.kling.com/v1/videos/generate

# Parámetros
{
  "prompt": "Prompt técnico optimizado",
  "image": "URL de imagen de referencia",
  "duration": 60,  # segundos
  "style": "cinematographic"
}

# Respuesta
{
  "video_id": "string",
  "status": "processing",
  "video_url": "https://..."
}
```

---

## 4. Diseño de Base de Datos

### 4.1 Esquema de Tablas

```sql
-- Tabla de Proyectos
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  synopsis TEXT,
  status ENUM('CREATED', 'STRUCTURED', 'PROMPTS_GENERATED', 'STORYBOARD_GENERATED', 'NARRATION_GENERATED', 'VIDEO_GENERATED', 'COMPLETED', 'FAILED') DEFAULT 'CREATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de Escenas
CREATE TABLE scenes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  scene_id INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  dialogue TEXT,
  visual_elements JSON,
  mood VARCHAR(100),
  duration_seconds INT,
  video_prompt TEXT,
  image_prompt TEXT,
  style_parameters JSON,
  storyboard_image_url VARCHAR(500),
  storyboard_storage_key VARCHAR(255),
  narration_audio_url VARCHAR(500),
  narration_storage_key VARCHAR(255),
  video_clip_url VARCHAR(500),
  video_storage_key VARCHAR(255),
  status ENUM('PENDING', 'PROMPTS_READY', 'STORYBOARD_GENERATED', 'NARRATION_GENERATED', 'VIDEO_GENERATED', 'COMPLETED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabla de Historial de Generación
CREATE TABLE generation_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  stage VARCHAR(100),
  status ENUM('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'),
  progress_percentage INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabla de Entrada del Usuario
CREATE TABLE project_inputs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_idea TEXT,
  reference_image_url VARCHAR(500),
  reference_image_key VARCHAR(255),
  num_clips INT,
  clip_duration_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### 4.2 Relaciones de Datos

```
users (1) ──→ (many) projects
projects (1) ──→ (many) scenes
projects (1) ──→ (many) generation_history
projects (1) ──→ (1) project_inputs
```

---

## 5. Estructura de Carpetas del Proyecto

```
story-video-generator/
├── client/                          # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── ProgressPanel.tsx
│   │   │   ├── StoryboardGallery.tsx
│   │   │   ├── VideoClipGallery.tsx
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── ProjectHistory.tsx
│   │   │   └── Settings.tsx
│   │   ├── contexts/
│   │   │   ├── ThemeContext.tsx
│   │   │   └── ProjectContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useProject.ts
│   │   ├── lib/
│   │   │   └── trpc.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css               # Neon-noir theme
│   └── index.html
│
├── server/                          # Backend Express + tRPC
│   ├── _core/
│   │   ├── index.ts
│   │   ├── context.ts
│   │   ├── trpc.ts
│   │   ├── env.ts
│   │   ├── llm.ts
│   │   ├── imageGeneration.ts
│   │   ├── voiceTranscription.ts
│   │   └── notification.ts
│   ├── agents/                      # CrewAI agents
│   │   ├── screenwriter.py
│   │   ├── prompt_engineer.py
│   │   └── crew.py
│   ├── services/                    # API integrations
│   │   ├── elevenlabs_service.py
│   │   ├── image_generation_service.py
│   │   ├── video_generation_service.py
│   │   └── pipeline_orchestrator.py
│   ├── db.ts                        # Database helpers
│   ├── routers.ts                   # tRPC procedures
│   ├── storage.ts                   # File storage helpers
│   └── auth.logout.test.ts
│
├── drizzle/                         # Database schema
│   ├── schema.ts
│   └── migrations/
│
├── shared/                          # Código compartido
│   ├── const.ts
│   └── types.ts
│
├── storage/                         # S3 storage configuration
│   └── index.ts
│
├── ARCHITECTURE.md                  # Este archivo
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── .env.example
```

---

## 6. Flujo de Datos Detallado

### 6.1 Creación de Proyecto

```
1. Usuario completa formulario en Frontend
   ├── idea/guion
   ├── número de clips
   ├── duración por clip
   └── imagen de referencia

2. Frontend → tRPC: trpc.projects.create.useMutation()
   └── Envía: { idea, numClips, duration, referenceImage }

3. Backend tRPC Procedure: projects.create
   ├── Valida entrada
   ├── Crea registro en tabla 'projects' (status: CREATED)
   ├── Crea registro en tabla 'project_inputs'
   ├── Crea registros en tabla 'scenes' (vacíos, status: PENDING)
   └── Retorna: { projectId, status }

4. Frontend recibe projectId
   └── Redirige a: /projects/{projectId}
```

### 6.2 Ejecución del Pipeline

```
1. Usuario hace click en "Generate"
   └── Frontend → tRPC: trpc.projects.startPipeline.useMutation()

2. Backend tRPC Procedure: projects.startPipeline
   ├── Obtiene datos del proyecto
   ├── Inicia ejecución asincrónica del pipeline
   ├── Retorna: { projectId, status: 'PROCESSING' }
   └── Continúa en background (no bloquea)

3. Pipeline Background (Python + CrewAI)
   
   Etapa 1: Agente Guionista
   ├── Recibe: idea, referencia, num_clips
   ├── Ejecuta: LLM para generar historia
   ├── Salida: escenas estructuradas
   ├── Actualiza: projects.status = 'STRUCTURED'
   └── Notifica: Frontend via WebSocket/polling
   
   Etapa 2: Agente Prompt Engineer
   ├── Recibe: escenas del Guionista
   ├── Ejecuta: LLM para optimizar prompts
   ├── Salida: prompts técnicos
   ├── Actualiza: projects.status = 'PROMPTS_GENERATED'
   └── Notifica: Frontend
   
   Etapa 3: Generación de Storyboard
   ├── Para cada escena:
   │   ├── Llama: API de generación de imágenes
   │   ├── Guarda: URL en scenes.storyboard_image_url
   │   └── Actualiza: scenes.status = 'STORYBOARD_GENERATED'
   ├── Actualiza: projects.status = 'STORYBOARD_GENERATED'
   └── Notifica: Frontend (usuario puede revisar)
   
   Etapa 4: Generación de Narración
   ├── Para cada escena:
   │   ├── Llama: ElevenLabs API
   │   ├── Guarda: URL en scenes.narration_audio_url
   │   └── Actualiza: scenes.status = 'NARRATION_GENERATED'
   ├── Actualiza: projects.status = 'NARRATION_GENERATED'
   └── Notifica: Frontend
   
   Etapa 5: Generación de Video
   ├── Para cada escena (paralelo si es posible):
   │   ├── Llama: Video generation API
   │   ├── Guarda: URL en scenes.video_clip_url
   │   └── Actualiza: scenes.status = 'VIDEO_GENERATED'
   ├── Actualiza: projects.status = 'VIDEO_GENERATED'
   └── Notifica: Frontend
   
   Etapa 6: Ensamblaje Final
   ├── Sincroniza: audio + video
   ├── Genera: video final completo
   ├── Guarda: URL en projects.final_video_url
   ├── Actualiza: projects.status = 'COMPLETED'
   ├── Crea: registro en generation_history
   ├── Notifica: Frontend
   └── **DISPARA: notifyOwner() para notificación automática**

4. Frontend recibe actualizaciones en tiempo real
   ├── Actualiza: progress bar
   ├── Muestra: estado actual de cada etapa
   └── Renderiza: storyboard cuando esté listo
```

---

## 7. Sistema de Notificaciones

### 7.1 Notificación Automática al Propietario

Cuando el pipeline completa todas las etapas exitosamente:

```python
# En server/services/pipeline_orchestrator.py

async def notify_owner_on_completion(project_id: int, project_title: str):
    """
    Dispara notificación automática al propietario cuando el proyecto se completa
    """
    await notifyOwner({
        "title": f"✨ Proyecto '{project_title}' Completado",
        "content": f"El pipeline multi-agente ha completado exitosamente la generación de video. "
                   f"Proyecto ID: {project_id}. "
                   f"Accede a la plataforma para revisar el resultado.",
        "action_url": f"/projects/{project_id}"
    })
```

### 7.2 Actualizaciones en Tiempo Real

```typescript
// Frontend: useEffect para polling o WebSocket
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await trpc.projects.getProgress.useQuery({ projectId });
    setProgress(data);
  }, 2000);  // Polling cada 2 segundos
  
  return () => clearInterval(interval);
}, [projectId]);
```

---

## 8. Consideraciones de Rendimiento y Escalabilidad

### 8.1 Paralelización

- **Generación de Storyboard**: Ejecutar en paralelo para múltiples escenas (máx 5 concurrentes)
- **Generación de Narración**: Ejecutar en paralelo (máx 3 concurrentes para ElevenLabs)
- **Generación de Video**: Ejecutar en paralelo si es posible (depende de API)

### 8.2 Optimización de Costos

- Implementar caché de prompts similares
- Reutilizar imágenes de referencia cuando sea posible
- Limitar duración máxima de videos
- Implementar rate limiting para APIs de pago

### 8.3 Manejo de Errores

- Implementar reintentos automáticos (máx 3 intentos)
- Guardar logs detallados de errores
- Permitir al usuario reanudar desde etapa fallida
- Notificar al usuario sobre fallos específicos

---

## 9. Seguridad y Privacidad

- Validar entrada del usuario (tamaño de imagen, longitud de texto)
- Encriptar API keys en variables de entorno
- Implementar rate limiting por usuario
- Auditar acceso a proyectos (solo propietario puede acceder)
- Limpiar archivos temporales después de generación

---

## 10. Roadmap de Implementación

**Fase 1**: Arquitectura y documentación ✓
**Fase 2**: Frontend React con diseño neon-noir
**Fase 3**: Backend Python con CrewAI
**Fase 4**: Integración de APIs externas
**Fase 5**: Panel de progreso en tiempo real
**Fase 6**: Historial de proyectos y persistencia
**Fase 7**: Testing y optimización

---

## Referencias

- [CrewAI Documentation](https://docs.crewai.com/)
- [ElevenLabs API Reference](https://elevenlabs.io/docs/api-reference)
- [Manus Built-in APIs](https://help.manus.im)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
