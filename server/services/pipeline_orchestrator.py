"""
Pipeline Orchestrator - Orquesta la ejecución del pipeline multi-agente
"""
import asyncio
import json
from typing import Dict, List, Optional, Callable
from datetime import datetime
from enum import Enum

from server.agents.screenwriter import ScreenwriterAgent
from server.agents.prompt_engineer import PromptEngineerAgent


class PipelineStage(str, Enum):
    """Etapas del pipeline"""
    STRUCTURED = "STRUCTURED"
    PROMPTS_GENERATED = "PROMPTS_GENERATED"
    STORYBOARD_GENERATED = "STORYBOARD_GENERATED"
    NARRATION_GENERATED = "NARRATION_GENERATED"
    VIDEO_GENERATED = "VIDEO_GENERATED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PipelineOrchestrator:
    """
    Orquesta la ejecución del pipeline multi-agente para generación de videos.
    Coordina la ejecución secuencial de agentes y maneja el estado del proyecto.
    """

    def __init__(self, llm, progress_callback: Optional[Callable] = None):
        """
        Inicializa el orquestador del pipeline.
        
        Args:
            llm: Instancia del modelo de lenguaje
            progress_callback: Función para reportar progreso (opcional)
        """
        self.llm = llm
        self.progress_callback = progress_callback
        
        # Inicializar agentes
        self.screenwriter = ScreenwriterAgent(llm)
        self.prompt_engineer = PromptEngineerAgent(llm)

    async def execute_pipeline(
        self,
        project_id: int,
        user_idea: str,
        num_clips: int,
        clip_duration: int,
        reference_image: Optional[str] = None,
    ) -> Dict:
        """
        Ejecuta el pipeline completo de generación de video.
        
        Args:
            project_id: ID del proyecto
            user_idea: Idea/guion del usuario
            num_clips: Número de clips
            clip_duration: Duración de cada clip en segundos
            reference_image: URL de imagen de referencia (opcional)
            
        Returns:
            dict: Resultado del pipeline con todas las etapas
        """
        result = {
            "project_id": project_id,
            "status": "in_progress",
            "stages": {},
            "error": None,
        }

        try:
            # Etapa 1: Generación de Historia (Agente Guionista)
            await self._report_progress(project_id, "Generando historia...", 10)
            result["stages"]["screenwriting"] = await self._stage_screenwriting(
                user_idea, num_clips, clip_duration, reference_image
            )

            # Etapa 2: Optimización de Prompts (Agente Prompt Engineer)
            await self._report_progress(project_id, "Optimizando prompts técnicos...", 30)
            result["stages"]["prompt_engineering"] = await self._stage_prompt_engineering(
                result["stages"]["screenwriting"]["story"],
                reference_image,
            )

            # Etapa 3: Generación de Storyboard (Imágenes de previsualización)
            await self._report_progress(project_id, "Generando storyboard visual...", 50)
            result["stages"]["storyboard_generation"] = await self._stage_storyboard_generation(
                result["stages"]["prompt_engineering"]["optimized_scenes"],
                project_id,
            )

            # Etapa 4: Generación de Narración (ElevenLabs)
            await self._report_progress(project_id, "Generando narración...", 65)
            result["stages"]["narration_generation"] = await self._stage_narration_generation(
                result["stages"]["screenwriting"]["story"]["scenes"],
                project_id,
            )

            # Etapa 5: Generación de Video (Kling/similar)
            await self._report_progress(project_id, "Generando clips de video...", 80)
            result["stages"]["video_generation"] = await self._stage_video_generation(
                result["stages"]["prompt_engineering"]["optimized_scenes"],
                reference_image,
                project_id,
            )

            # Etapa 6: Ensamblaje Final
            await self._report_progress(project_id, "Ensamblando video final...", 95)
            result["stages"]["assembly"] = await self._stage_assembly(
                result["stages"],
                project_id,
            )

            result["status"] = "completed"
            await self._report_progress(project_id, "Pipeline completado exitosamente", 100)

        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)
            await self._report_progress(project_id, f"Error: {str(e)}", 0)

        return result

    async def _stage_screenwriting(
        self,
        user_idea: str,
        num_clips: int,
        clip_duration: int,
        reference_image: Optional[str],
    ) -> Dict:
        """Ejecuta la etapa de escritura de guion."""
        try:
            # Ejecutar el agente screenwriter
            story = self.screenwriter.create_story(
                user_idea, num_clips, clip_duration, reference_image
            )
            
            return {
                "status": "completed",
                "story": story,
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
            }

    async def _stage_prompt_engineering(
        self,
        story: Dict,
        reference_image: Optional[str],
    ) -> Dict:
        """Ejecuta la etapa de ingeniería de prompts."""
        try:
            scenes = story.get("scenes", [])
            
            # Ejecutar el agente prompt engineer
            optimized = self.prompt_engineer.optimize_scenes(
                scenes, reference_image=reference_image
            )
            
            return {
                "status": "completed",
                "optimized_scenes": optimized.get("optimized_scenes", []),
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
            }

    async def _stage_storyboard_generation(
        self,
        optimized_scenes: List[Dict],
        project_id: int,
    ) -> Dict:
        """Ejecuta la etapa de generación de storyboard."""
        # Placeholder: Integración con API de generación de imágenes
        # En implementación real, llamaría a generateImage() de Manus
        return {
            "status": "pending",
            "message": "Storyboard generation placeholder",
        }

    async def _stage_narration_generation(
        self,
        scenes: List[Dict],
        project_id: int,
    ) -> Dict:
        """Ejecuta la etapa de generación de narración."""
        # Placeholder: Integración con ElevenLabs API
        return {
            "status": "pending",
            "message": "Narration generation placeholder",
        }

    async def _stage_video_generation(
        self,
        optimized_scenes: List[Dict],
        reference_image: Optional[str],
        project_id: int,
    ) -> Dict:
        """Ejecuta la etapa de generación de video."""
        # Placeholder: Integración con Kling API
        return {
            "status": "pending",
            "message": "Video generation placeholder",
        }

    async def _stage_assembly(
        self,
        stages: Dict,
        project_id: int,
    ) -> Dict:
        """Ejecuta la etapa de ensamblaje final."""
        # Placeholder: Sincronización de audio y video
        return {
            "status": "pending",
            "message": "Assembly placeholder",
        }

    async def _report_progress(
        self,
        project_id: int,
        message: str,
        progress: int,
    ) -> None:
        """Reporta el progreso del pipeline."""
        if self.progress_callback:
            await self.progress_callback({
                "project_id": project_id,
                "message": message,
                "progress": progress,
                "timestamp": datetime.now().isoformat(),
            })
