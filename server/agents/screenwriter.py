"""
Screenwriter Agent - Genera historias estructuradas divididas en escenas
"""
from langchain_core.prompts import ChatPromptTemplate
from typing import Optional
import json


class ScreenwriterAgent:
    """
    Agente especializado en escritura de guiones cinematográficos.
    Genera historias estructuradas y las divide en escenas individuales.
    """

    def __init__(self, llm):
        """
        Inicializa el agente Screenwriter.
        
        Args:
            llm: Instancia del modelo de lenguaje (ej: ChatOpenAI)
        """
        self.llm = llm
        self.chain = self._create_chain()

    def _create_chain(self):
        """
        Crea la cadena LangChain para escritura de guiones.
        
        Returns:
            Runnable: Cadena configurada para generar historias
        """
        prompt_template = ChatPromptTemplate.from_template(
            """Eres un guionista cinematográfico experimentado con expertise en narrativa visual,
estructura de tres actos, y creación de escenas impactantes. Tu objetivo es generar historias 
cinematográficas estructuradas y divididas en escenas coherentes.

Tu tarea es generar una historia basada en:
- Idea: {user_idea}
- Número de escenas: {num_clips}
- Duración por escena: {clip_duration} segundos
{reference_context}

REQUISITOS:
1. Divide la historia en exactamente {num_clips} escenas coherentes
2. Cada escena debe tener aproximadamente {clip_duration} segundos de duración
3. Asegura continuidad narrativa entre escenas
4. Define el mood/atmósfera para cada escena (ej: "neon-noir cinematographic")
5. Incluye diálogos breves y descriptivos para cada escena
6. Especifica elementos visuales clave para cada escena

SALIDA REQUERIDA (JSON):
{{
    "title": "Título de la historia",
    "synopsis": "Sinopsis breve (2-3 líneas)",
    "total_duration_seconds": {total_seconds},
    "scenes": [
        {{
            "scene_id": 1,
            "title": "Título de la escena",
            "description": "Descripción detallada de la escena",
            "dialogue": "Diálogo o narración",
            "visual_elements": ["elemento1", "elemento2", "elemento3"],
            "mood": "Atmósfera/mood de la escena",
            "duration_seconds": {clip_duration}
        }}
    ]
}}

Asegúrate de que el JSON sea válido y que cada escena tenga exactamente {clip_duration} segundos."""
        )
        return prompt_template | self.llm

    def create_story(
        self,
        user_idea: str,
        num_clips: int,
        clip_duration: int,
        reference_image: Optional[str] = None,
    ) -> dict:
        """
        Genera una historia estructurada.
        
        Args:
            user_idea: Idea, guion o descripción del usuario
            num_clips: Número de clips/escenas deseadas
            clip_duration: Duración de cada clip en segundos
            reference_image: URL o descripción de imagen de referencia (opcional)
            
        Returns:
            dict: Historia estructurada en formato JSON
        """
        reference_context = ""
        if reference_image:
            reference_context = f"- Imagen de referencia: {reference_image}"

        # Ejecutar la cadena
        output = self.chain.invoke({
            "user_idea": user_idea,
            "num_clips": num_clips,
            "clip_duration": clip_duration,
            "total_seconds": num_clips * clip_duration,
            "reference_context": reference_context,
        })

        # Parsear el resultado
        return self.parse_story_output(str(output.content) if hasattr(output, 'content') else str(output))

    @staticmethod
    def parse_story_output(output: str) -> dict:
        """
        Parsea la salida del LLM para extraer el JSON de la historia.
        
        Args:
            output: Salida de texto del modelo
            
        Returns:
            dict: Historia estructurada en formato JSON
        """
        try:
            # Intenta extraer JSON del output
            json_start = output.find("{")
            json_end = output.rfind("}") + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = output[json_start:json_end]
                return json.loads(json_str)
            else:
                raise ValueError("No se encontró JSON válido en la salida")
        except json.JSONDecodeError as e:
            raise ValueError(f"Error al parsear JSON: {e}")
