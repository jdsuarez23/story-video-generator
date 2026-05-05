# Story Video Generator - Guía de Implementación

## Descripción General

**Story Video Generator** es una plataforma web cinematográfica neon-noir que utiliza un sistema multi-agente basado en CrewAI para generar automáticamente videos a partir de ideas, guiones o imágenes de referencia.

## Stack Tecnológico

### Frontend
- **React 19** con TypeScript
- **Tailwind CSS 4** para estilos neon-noir
- **tRPC** para comunicación cliente-servidor
- **Wouter** para enrutamiento
- **Lucide React** para iconografía

### Backend
- **Express.js** para servidor HTTP
- **Node.js** para runtime
- **Python** con **CrewAI** para orquestación multi-agente
- **Drizzle ORM** para gestión de base de datos
- **MySQL/TiDB** para persistencia de datos

### APIs Externas
- **ElevenLabs** para generación de narración
- **Manus Built-in APIs** para generación de imágenes
- **Kling API** (placeholder) para generación de video

## Estructura del Proyecto

```
story-video-generator/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── contexts/          # Contextos (ProjectContext)
│   │   ├── hooks/             # Custom hooks
│   │   └── index.css          # Estilos neon-noir
│   └── index.html
│
├── server/                    # Backend Express + tRPC
│   ├── agents/                # Agentes CrewAI (Python)
│   │   ├── screenwriter.py    # Agente Guionista
│   │   └── prompt_engineer.py # Agente Prompt Engineer
│   ├── services/              # Servicios
│   │   └── pipeline_orchestrator.py
│   ├── db.ts                  # Helpers de base de datos
│   ├── routers.ts             # Procedimientos tRPC
│   └── _core/                 # Framework plumbing
│
├── drizzle/                   # Esquema y migraciones
│   ├── schema.ts              # Definición de tablas
│   └── migrations/            # Archivos SQL
│
├── ARCHITECTURE.md            # Documentación de arquitectura
├── IMPLEMENTATION_GUIDE.md    # Esta guía
├── requirements.txt           # Dependencias Python
└── package.json               # Dependencias Node.js
```

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
cd /home/ubuntu/story-video-generator
```

### 2. Instalar Dependencias Frontend

```bash
pnpm install
```

### 3. Instalar Dependencias Python

```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
# Base de Datos
DATABASE_URL=mysql://user:password@localhost:3306/story_video_generator

# Manus OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
JWT_SECRET=your_jwt_secret

# APIs Externas
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# OpenAI (para CrewAI)
OPENAI_API_KEY=your_openai_key

# Manus Built-in APIs
BUILT_IN_FORGE_API_KEY=your_forge_key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
```

### 5. Configurar Base de Datos

```bash
# Generar migraciones
pnpm drizzle-kit generate

# Aplicar migraciones
# (Usar webdev_execute_sql en el panel de Manus)
```

### 6. Iniciar Desarrollo

```bash
# Terminal 1: Frontend + Backend Express
pnpm dev

# Terminal 2: Python backend (si es necesario)
python -m server.services.pipeline_orchestrator
```

## Arquitectura Multi-Agente

### Agentes Implementados

#### 1. **Screenwriter Agent** (Guionista)
- **Rol**: Escritor de historias cinematográficas
- **Entrada**: Idea/guion del usuario, número de clips, duración
- **Salida**: Historia estructurada dividida en escenas
- **Archivo**: `server/agents/screenwriter.py`

```python
from server.agents.screenwriter import ScreenwriterAgent

screenwriter = ScreenwriterAgent(llm)
task = screenwriter.create_story_task(
    user_idea="Una noche en la metrópolis futurista",
    num_clips=5,
    clip_duration=60
)
```

#### 2. **Prompt Engineer Agent**
- **Rol**: Ingeniero de prompts para generación de IA
- **Entrada**: Escenas narrativas del Guionista
- **Salida**: Prompts técnicos optimizados para video e imágenes
- **Archivo**: `server/agents/prompt_engineer.py`

```python
from server.agents.prompt_engineer import PromptEngineerAgent

engineer = PromptEngineerAgent(llm)
task = engineer.create_optimization_task(
    scenes=story["scenes"],
    visual_style="neon-noir cinematographic"
)
```

### Flujo del Pipeline

```
1. Usuario crea proyecto
   ↓
2. Screenwriter Agent genera historia
   ↓
3. Prompt Engineer Agent optimiza prompts
   ↓
4. Generador de Imágenes crea storyboard
   ↓
5. ElevenLabs genera narración
   ↓
6. Generador de Video crea clips
   ↓
7. Ensamblador sincroniza audio/video
   ↓
8. Notificación al propietario
```

## Procedimientos tRPC

### Crear Proyecto

```typescript
const { mutate: createProject } = trpc.projects.create.useMutation({
  onSuccess: (project) => {
    console.log("Proyecto creado:", project);
  },
});

createProject({
  title: "Mi Primer Video",
  idea: "Una historia futurista",
  numClips: 5,
  clipDuration: 60,
  referenceImage: file,
});
```

### Iniciar Pipeline

```typescript
const { mutate: startPipeline } = trpc.projects.startPipeline.useMutation();

startPipeline({ projectId: 1 });
```

### Obtener Progreso

```typescript
const { data: progress } = trpc.projects.getProgress.useQuery({
  projectId: 1,
});
```

## Componentes React

### ProjectForm
Formulario para crear nuevos proyectos.

```tsx
<ProjectForm
  onSubmit={async (data) => {
    // Crear proyecto
  }}
  isLoading={false}
/>
```

### ProgressPanel
Panel de progreso del pipeline.

```tsx
<ProgressPanel
  stages={[
    {
      id: "screenwriting",
      name: "Generación de Historia",
      status: "completed",
      progress: 100,
    },
    // ...
  ]}
  overallProgress={45}
/>
```

### StoryboardGallery
Galería de escenas con previsualizaciones.

```tsx
<StoryboardGallery
  scenes={scenes}
  onSceneSelect={(scene) => {
    console.log("Escena seleccionada:", scene);
  }}
/>
```

## Base de Datos

### Tablas Principales

#### projects
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  synopsis TEXT,
  status ENUM(...),
  finalVideoUrl VARCHAR(500),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### scenes
```sql
CREATE TABLE scenes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  sceneNumber INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  dialogue TEXT,
  videoPrompt TEXT,
  imagePrompt TEXT,
  storyboardImageUrl VARCHAR(500),
  narrationAudioUrl VARCHAR(500),
  videoClipUrl VARCHAR(500),
  status ENUM(...)
);
```

## Integración de APIs Externas

### ElevenLabs

```python
from elevenlabs import generate, play

audio = generate(
    text="Narración de la escena",
    voice="21m00Tcm4TlvDq8ikWAM",
    model="eleven_monolingual_v1"
)
```

### Generación de Imágenes (Manus)

```typescript
import { generateImage } from "./server/_core/imageGeneration";

const { url } = await generateImage({
  prompt: "Prompt técnico del Agente Prompt Engineer",
  style: "cinematographic neon-noir"
});
```

## Sistema de Notificaciones

Cuando el pipeline se completa exitosamente:

```python
from server._core.notification import notifyOwner

await notifyOwner({
    "title": "✨ Proyecto Completado",
    "content": f"El pipeline ha completado la generación de video para el proyecto '{project_title}'",
    "action_url": f"/projects/{project_id}"
})
```

## Guía de Desarrollo

### Agregar un Nuevo Agente

1. Crear archivo en `server/agents/new_agent.py`
2. Heredar de `Agent` de CrewAI
3. Implementar método `create_task()`
4. Integrar en `PipelineOrchestrator`

### Agregar un Nuevo Componente React

1. Crear archivo en `client/src/components/NewComponent.tsx`
2. Usar clases neon-noir: `btn-neon`, `card-neon`, `input-neon`
3. Importar en página correspondiente

### Agregar Procedimiento tRPC

1. Crear función en `server/routers.ts`
2. Usar `publicProcedure` o `protectedProcedure`
3. Consumir en frontend con `trpc.*.useQuery/useMutation`

## Testing

### Tests Unitarios

```bash
pnpm test
```

### Tests de Integración

```bash
# Crear proyecto de prueba
curl -X POST http://localhost:3000/api/trpc/projects.create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","idea":"Test idea"}'
```

## Deployment

### Preparar para Producción

1. Crear checkpoint
2. Ejecutar tests
3. Optimizar imágenes y assets
4. Configurar variables de entorno

### Publicar

Usar el botón "Publish" en el panel de Manus después de crear checkpoint.

## Troubleshooting

### Error: "Cannot apply unknown utility class"
- Asegurar que Tailwind CSS 4 está correctamente configurado
- Usar sintaxis OKLCH para colores: `oklch(0.65 0.25 320)`

### Error: "CrewAI agents not responding"
- Verificar que OpenAI API key es válida
- Revisar logs del servidor Python
- Aumentar timeout si es necesario

### Error: "Database connection failed"
- Verificar DATABASE_URL en .env
- Asegurar que MySQL/TiDB está corriendo
- Verificar permisos de usuario

## Próximos Pasos

1. **Integración Completa de APIs**
   - Implementar generación de imágenes
   - Integrar ElevenLabs completamente
   - Conectar Kling API para video

2. **Optimizaciones de Rendimiento**
   - Caché de prompts similares
   - Paralelización de generación
   - Compresión de video

3. **Características Avanzadas**
   - Edición de escenas post-generación
   - Templates de estilos
   - Colaboración en tiempo real

## Referencias

- [CrewAI Documentation](https://docs.crewai.com/)
- [Manus Built-in APIs](https://help.manus.im)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [tRPC Documentation](https://trpc.io/)
- [ElevenLabs API](https://elevenlabs.io/docs)

## Soporte

Para reportar bugs o sugerencias, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Mayo 2026  
**Autor**: Manus AI
