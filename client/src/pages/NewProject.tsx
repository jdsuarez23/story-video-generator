import { ProjectForm } from '@/components/ProjectForm';
import { ArrowLeft, Film } from 'lucide-react';
import { Link, useLocation } from 'wouter';

// Proxy a través del servidor Express (sin CORS)
const PYTHON_API = '/api/python';

export default function NewProject() {
  const [, navigate] = useLocation();

  const handleSubmit = async (data: {
    title: string;
    idea: string;
    numClips: number;
    clipDuration: number;
    referenceImage?: File;
  }) => {
    // Generar un ID temporal siempre (la DB puede no estar disponible)
    const tempId = Date.now();

    try {
      // Intentar guardar en DB (opcional, no bloquea el flujo)
      const createRes = await fetch('/api/trpc/projects.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          json: {
            title: data.title,
            userIdea: data.idea,
            numClips: data.numClips,
            clipDurationSeconds: data.clipDuration,
          },
        }),
      });

      if (createRes.ok) {
        const createJson = await createRes.json();
        const dbProjectId: number | null = createJson?.result?.data?.json?.projectId ?? null;
        const projectId = dbProjectId ?? tempId;
        await launchPipeline(projectId, data);
        navigate(`/projects/${projectId}`);
        return;
      }
    } catch {
      // DB no disponible — continuar con ID temporal
    }

    // Fallback: lanzar pipeline con ID temporal
    await launchPipeline(tempId, data).catch(console.warn);
    navigate(`/projects/${tempId}`);
  };

  const launchPipeline = async (
    projectId: number,
    data: { idea: string; numClips: number; clipDuration: number }
  ) => {
    try {
      await fetch(`${PYTHON_API}/start-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          user_idea: data.idea,
          num_clips: data.numClips,
          clip_duration: data.clipDuration,
        }),
      });
    } catch (err) {
      console.warn('Pipeline server not available:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">Story Video Gen</span>
          </div>
        </div>
      </header>

      {/* Form */}
      <ProjectForm onSubmit={handleSubmit} />
    </div>
  );
}
