# 🎬 Story Video Generator - Multi-Agent AI Platform

Una plataforma web cinematográfica **neon-noir** que utiliza un sistema multi-agente basado en **CrewAI** para generar automáticamente videos de alta calidad a partir de ideas, guiones o imágenes de referencia.

## ✨ Características Principales

### 🤖 Pipeline Multi-Agente
- **Agente Guionista**: Genera historias estructuradas y las divide en escenas coherentes
- **Agente Prompt Engineer**: Optimiza cada escena en prompts técnicos para máxima calidad visual
- **Generador de Imágenes**: Crea storyboard visual de previsualización
- **Narrador (ElevenLabs)**: Genera voice-over sincronizado y coherente
- **Generador de Video**: Produce clips cinematográficos con consistencia visual
- **Ensamblador**: Sincroniza audio y video en el resultado final

### 🎨 Diseño Cinematográfico Neon-Noir
- Paleta de colores: Azul marino oscuro, hot pink, cyan eléctrico, magenta
- Efectos de brillo (glow) y sombras neon
- Tipografía cinematográfica con espaciado amplio
- Líneas de acento verticales minimalistas
- Atmósfera futurista y misteriosa

### 📊 Dashboard Completo
- Formulario intuitivo para crear proyectos
- Panel de progreso en tiempo real del pipeline
- Galería de clips con reproductor individual
- Historial de proyectos guardados
- Notificaciones automáticas al completar

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 22+
- Python 3.9+
- MySQL 8.0+ o TiDB
- Claves API: OpenAI, ElevenLabs, Manus

### Instalación

```bash
# 1. Clonar repositorio
cd /home/ubuntu/story-video-generator

# 2. Instalar dependencias
pnpm install
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves API

# 4. Inicializar base de datos
pnpm drizzle-kit generate
# Aplicar migraciones en panel de Manus

# 5. Iniciar desarrollo
pnpm dev
```

Acceder a `http://localhost:3000`

## 📁 Estructura del Proyecto

```
story-video-generator/
├── client/                      # Frontend React + Tailwind
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── ProgressPanel.tsx
│   │   │   ├── StoryboardGallery.tsx
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── Home.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── contexts/            # Contextos React
│   │   │   └── ProjectContext.tsx
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilidades
│   │   ├── App.tsx              # Rutas principales
│   │   └── index.css            # Estilos neon-noir
│   └── index.html
│
├── server/                      # Backend Express + tRPC
│   ├── agents/                  # Agentes CrewAI (Python)
│   │   ├── screenwriter.py      # Agente Guionista
│   │   └── prompt_engineer.py   # Agente Prompt Engineer
│   ├── services/                # Servicios backend
│   │   ├── pipeline_orchestrator.py
│   │   ├── elevenlabs_service.py
│   │   └── image_generation_service.py
│   ├── db.ts                    # Helpers de base de datos
│   ├── routers.ts               # Procedimientos tRPC
│   └── _core/                   # Framework plumbing
│
├── drizzle/                     # ORM y migraciones
│   ├── schema.ts                # Definición de tablas
│   └── migrations/              # Archivos SQL
│
├── ARCHITECTURE.md              # Documentación de arquitectura
├── IMPLEMENTATION_GUIDE.md      # Guía de implementación
├── requirements.txt             # Dependencias Python
├── package.json                 # Dependencias Node.js
└── README.md                    # Este archivo
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Base de Datos
DATABASE_URL=mysql://user:password@localhost:3306/story_video_generator

# Manus OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your_jwt_secret

# APIs Externas
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Manus Built-in APIs
BUILT_IN_FORGE_API_KEY=your_key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
```

## 📚 Documentación

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura completa del sistema
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Guía técnica de implementación

## 🎯 Flujo de Uso

### 1. Crear Proyecto
El usuario ingresa:
- Idea o guion
- Número de clips (1-20)
- Duración por clip (10-120 segundos)
- Imagen de referencia (opcional)

### 2. Ejecución del Pipeline
```
Screenwriter Agent
    ↓ (genera historia)
Prompt Engineer Agent
    ↓ (optimiza prompts)
Generador de Imágenes
    ↓ (crea storyboard)
ElevenLabs
    ↓ (genera narración)
Generador de Video
    ↓ (crea clips)
Ensamblador
    ↓ (sincroniza audio/video)
Video Final + Notificación
```

### 3. Revisión y Descarga
- Ver storyboard visual
- Escuchar narración
- Descargar video final
- Guardar en historial

## 🛠️ Desarrollo

### Agregar Nuevo Agente

```python
# server/agents/new_agent.py
from crewai import Agent, Task

class NewAgent:
    def __init__(self, llm):
        self.agent = Agent(
            role="Tu rol",
            goal="Tu objetivo",
            llm=llm
        )
    
    def create_task(self, input_data):
        return Task(
            description="...",
            agent=self.agent
        )
```

### Agregar Nuevo Componente

```tsx
// client/src/components/NewComponent.tsx
import { Card } from '@/components/ui/card';

export const NewComponent: React.FC = () => {
  return (
    <Card className="card-neon p-6">
      <h3 className="text-xl font-bold text-primary neon-glow">
        Título
      </h3>
    </Card>
  );
};
```

### Ejecutar Tests

```bash
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en watch mode
pnpm test:watch
```

## 🎨 Paleta de Colores Neon-Noir

| Color | OKLCH | Uso |
|-------|-------|-----|
| Midnight Navy | `oklch(0.08 0.01 280)` | Fondo principal |
| Hot Pink | `oklch(0.65 0.25 320)` | Títulos, botones primarios |
| Cyan Eléctrico | `oklch(0.75 0.25 200)` | Acentos, botones secundarios |
| Magenta | `oklch(0.60 0.25 330)` | Acentos adicionales |
| Slate Gray | `oklch(0.35 0.05 280)` | Texto secundario |

## 📊 Base de Datos

### Tablas Principales

- **projects**: Proyectos de usuarios
- **scenes**: Escenas individuales de cada proyecto
- **projectInputs**: Entrada inicial del usuario
- **generationHistory**: Historial de ejecución del pipeline

Ver [ARCHITECTURE.md](./ARCHITECTURE.md#4-diseño-de-base-de-datos) para esquema completo.

## 🔐 Seguridad

- Validación de entrada en frontend y backend
- Encriptación de API keys en variables de entorno
- Rate limiting en endpoints
- Autenticación OAuth con Manus
- Autorización basada en roles (user/admin)

## 🚀 Deployment

### Preparar para Producción

```bash
# 1. Crear checkpoint
# (Usar panel de Manus)

# 2. Ejecutar tests
pnpm test

# 3. Build
pnpm build

# 4. Publicar
# (Usar botón Publish en panel de Manus)
```

## 📈 Roadmap

- [ ] Integración completa de APIs externas
- [ ] Edición de escenas post-generación
- [ ] Templates de estilos predefinidos
- [ ] Colaboración en tiempo real
- [ ] Exportación a múltiples formatos
- [ ] Análisis de rendimiento de videos
- [ ] Marketplace de templates

## 🐛 Troubleshooting

### "Cannot apply unknown utility class"
```bash
# Asegurar Tailwind CSS 4 configurado correctamente
pnpm add -D tailwindcss@4
```

### "CrewAI agents not responding"
```bash
# Verificar OpenAI API key
echo $OPENAI_API_KEY

# Revisar logs
tail -f .manus-logs/devserver.log
```

### "Database connection failed"
```bash
# Verificar conexión MySQL
mysql -u user -p -h localhost

# Revisar DATABASE_URL
echo $DATABASE_URL
```

## 📞 Soporte

- 📧 Email: support@manus.im
- 🐛 Issues: Reportar en panel de Manus
- 💬 Chat: Comunidad de Manus

## 📄 Licencia

MIT License - Ver LICENSE.md para detalles

## 🙏 Agradecimientos

- CrewAI por el framework de agentes
- Manus por la plataforma y APIs
- ElevenLabs por generación de voz
- Tailwind CSS por utilidades de estilos

---

**Versión**: 1.0.0  
**Última actualización**: Mayo 2026  
**Creado con ❤️ por Manus AI**

### Stack Tecnológico

```
Frontend: React 19 + Tailwind CSS 4 + TypeScript
Backend: Express.js + tRPC + Node.js
AI: CrewAI + OpenAI
Database: MySQL/TiDB + Drizzle ORM
APIs: ElevenLabs, Manus Built-in, Kling (placeholder)
```

### Características de Seguridad

✅ Autenticación OAuth  
✅ Autorización basada en roles  
✅ Validación de entrada  
✅ Rate limiting  
✅ Encriptación de secrets  
✅ HTTPS obligatorio  

### Performance

⚡ Caché de prompts  
⚡ Paralelización de generación  
⚡ Compresión de video  
⚡ CDN para assets  
⚡ Lazy loading de componentes  

---

**¡Comienza a crear videos cinematográficos con IA ahora!** 🎬✨
