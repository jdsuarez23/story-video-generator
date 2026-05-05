"""
Prompt Engineer Agent - Convierte escenas en prompts técnicos optimizados para IA
"""
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Dict, Optional
import json


class PromptEngineerAgent:
    """
    Agente especializado en ingeniería de prompts para generación de imágenes y video.
    Convierte escenas narrativas en prompts técnicos optimizados.
    """

    def __init__(self, llm):
        """
        Inicializa el agente Prompt Engineer.
        
        Args:
            llm: Instancia del modelo de lenguaje
        """
        self.llm = llm
        self.chain = self._create_chain()

    def _create_chain(self):
        """
        Crea la cadena LangChain para ingeniería de prompts.
        
        Returns:
            Runnable: Cadena configurada para optimización de prompts
        """
        prompt_template = ChatPromptTemplate.from_template(
            """Eres un experto en ingeniería de prompts con profundo conocimiento de:
- Modelos de generación de imágenes (Dall-E, Midjourney, Stable Diffusion)
- Modelos de generación de video (Kling, Runway, Pika)
- Cinematografía y composición visual
- Teoría del color y lighting
- Estética visual específica (neon-noir, cyberpunk, etc.)

Tu objetivo es convertir escenas narrativas en prompts técnicos altamente optimizados para máxima calidad visual.

CONTEXTO:
- Estilo visual objetivo: {visual_style}
- Número de escenas: {num_scenes}
{reference_context}

ESCENAS A OPTIMIZAR:
{scenes_json}

REQUISITOS PARA CADA ESCENA:

1. VIDEO_PROMPT:
   - Descripción detallada para generación de video
   - Incluye: composición, movimiento de cámara, lighting, atmósfera
   - Especifica detalles técnicos: ángulos, profundidad de campo, transiciones
   - Asegura consistencia con escenas anteriores/posteriores
   - Longitud: 100-200 palabras

2. IMAGE_PROMPT:
   - Prompt para storyboard preview (imagen estática)
   - Captura el momento más icónico de la escena
   - Incluye: composición, lighting, mood, elementos visuales
   - Longitud: 50-100 palabras

3. STYLE_PARAMETERS:
   - lighting: Descripción del esquema de iluminación
   - color_palette: Colores dominantes y acentos
   - composition: Regla de composición (ej: "rule of thirds", "centered", etc.)
   - camera_movement: Tipo de movimiento de cámara (ej: "slow pan", "static", etc.)

SALIDA REQUERIDA (JSON):
{{
    "optimized_scenes": [
        {{
            "scene_id": 1,
            "video_prompt": "Prompt técnico detallado para video...",
            "image_prompt": "Prompt para storyboard preview...",
            "style_parameters": {{
                "lighting": "Descripción de iluminación",
                "color_palette": "Descripción de colores",
                "composition": "Tipo de composición",
                "camera_movement": "Tipo de movimiento"
            }}
        }}
    ]
}}

GUÍA DE ESTILO NEON-NOIR:
- Colores: Azul marino oscuro, hot pink, cyan eléctrico, magenta
- Lighting: Contraste alto, sombras profundas, acentos de luz neón
- Atmósfera: Futurista, nocturna, cinematográfica, misteriosa
- Composición: Asimétrica, líneas verticales de acento, profundidad

Asegúrate de que el JSON sea válido y que cada prompt sea específico y detallado."""
        )
        return prompt_template | self.llm

    def optimize_scenes(
        self,
        scenes: List[Dict],
        visual_style: str = "neon-noir cinematographic",
        reference_image: Optional[str] = None,
    ) -> dict:
        """
        Optimiza los prompts técnicos para cada escena.
        
        Args:
            scenes: Lista de escenas con descripción narrativa
            visual_style: Estilo visual deseado
            reference_image: URL de imagen de referencia para consistencia
            
        Returns:
            dict: Prompts optimizados en formato JSON
        """
        scenes_json = json.dumps(scenes, ensure_ascii=False, indent=2)
        reference_context = ""
        if reference_image:
            reference_context = f"Imagen de referencia para consistencia: {reference_image}"

        # Ejecutar la cadena
        output = self.chain.invoke({
            "visual_style": visual_style,
            "num_scenes": len(scenes),
            "scenes_json": scenes_json,
            "reference_context": reference_context,
        })

        # Parsear el resultado
        return self.parse_optimization_output(str(output.content) if hasattr(output, 'content') else str(output))

    @staticmethod
    def parse_optimization_output(output: str) -> dict:
        """
        Parsea la salida del LLM para extraer los prompts optimizados.
        
        Args:
            output: Salida de texto del modelo
            
        Returns:
            dict: Prompts optimizados en formato JSON
        """
        try:
            json_start = output.find("{")
            json_end = output.rfind("}") + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = output[json_start:json_end]
                return json.loads(json_str)
            else:
                raise ValueError("No se encontró JSON válido en la salida")
        except json.JSONDecodeError as e:
            raise ValueError(f"Error al parsear JSON: {e}")
