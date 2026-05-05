# Story Video Generator - Guía de Instalación y Configuración

## Requisitos Previos

- Node.js 22.13.0 o superior
- Python 3.9 o superior
- MySQL/TiDB para la base de datos
- npm o pnpm como gestor de paquetes

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd story-video-generator
```

### 2. Instalar Dependencias de Node.js

```bash
pnpm install
# o
npm install
```

### 3. Instalar Dependencias de Python

```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/story_video_generator

# Manus OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
JWT_SECRET=your_jwt_secret
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name

# External APIs
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_forge_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge

# Application
VITE_APP_TITLE=Story Video Generator
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

### 5. Configurar la Base de Datos

```bash
# Generar migraciones
pnpm drizzle-kit generate

# Aplicar migraciones (usando la UI de Manus)
# O ejecutar SQL manualmente
```

### 6. Iniciar el Servidor de Desarrollo

```bash
# Terminal 1: Servidor Node.js
pnpm dev

# Terminal 2: Servidor Python (opcional para desarrollo local)
python -m uvicorn server.agents.api:app --reload --port 8000
```

El servidor estará disponible en `http://localhost:3000`

## Configuración de APIs Externas

### ElevenLabs

1. Crear cuenta en [ElevenLabs](https://elevenlabs.io)
2. Obtener API key desde el dashboard
3. Agregar a `.env`:
   ```env
   ELEVENLABS_API_KEY=your_key_here
   ```

### Generación de Imágenes

La plataforma utiliza la API de generación de imágenes integrada de Manus. Las credenciales se inyectan automáticamente.

## Estructura del Proyecto

```
story-video-generator/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principales
│   │   ├── components/       # Componentes reutilizables
│   │   ├── contexts/         # Contextos de React
│   │   ├── lib/              # Utilidades y configuración
│   │   └── index.css         # Estilos globales neon-noir
│   └── public/               # Archivos estáticos
├── server/                    # Backend Node.js/Express
│   ├── routers/              # Procedimientos tRPC
│   ├── services/             # Servicios de negocio
│   ├── agents/               # Agentes Python (CrewAI)
│   ├── _core/                # Configuración central
│   └── db.ts                 # Helpers de base de datos
├── drizzle/                  # Esquema y migraciones
├── shared/                   # Código compartido
├── requirements.txt          # Dependencias Python
├── package.json              # Dependencias Node.js
└── ARCHITECTURE.md           # Documentación de arquitectura
```

## Desarrollo

### Agregar una Nueva Característica

1. **Actualizar el schema** en `drizzle/schema.ts`
2. **Generar migraciones**: `pnpm drizzle-kit generate`
3. **Crear procedimientos tRPC** en `server/routers/`
4. **Implementar UI** en `client/src/pages/` o `client/src/components/`
5. **Escribir tests** en `server/*.test.ts`

### Ejecutar Tests

```bash
pnpm test
```

### Build para Producción

```bash
pnpm build
```

## Troubleshooting

### Error: "Database not available"

- Verificar que `DATABASE_URL` está configurado correctamente
- Asegurar que el servidor MySQL/TiDB está corriendo
- Verificar credenciales de base de datos

### Error: "ElevenLabs API key not configured"

- Verificar que `ELEVENLABS_API_KEY` está en `.env`
- Asegurar que la clave es válida en ElevenLabs dashboard

### Error de Tailwind CSS

- Limpiar cache: `rm -rf node_modules/.vite`
- Reinstalar dependencias: `pnpm install`

## Deployment

### Usando Manus Platform

1. Crear checkpoint: `webdev_save_checkpoint`
2. Click en "Publish" en la UI de Manus
3. Configurar dominio personalizado (opcional)

### Usando Docker

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## Documentación Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Guía técnica detallada
- [README.md](./README.md) - Información general del proyecto

## Soporte

Para reportar bugs o solicitar características, crear un issue en el repositorio.
