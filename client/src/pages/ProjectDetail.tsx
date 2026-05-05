import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft, Download, Share2, Loader2,
  CheckCircle2, Clock, AlertCircle, Zap,
  Music, Video, Film,
} from 'lucide-react';
import { Link, useParams } from 'wouter';
import { useState, useEffect, useRef } from 'react';

const PYTHON_API = '/api/python';

interface StageStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
}

interface Clip {
  scene: number;
  title: string;
  video_url: string | null;
  audio_url: string | null;
}

interface PipelineResult {
  story_title: string;
  synopsis: string;
  scenes_count: number;
  clips: Clip[];
  has_audio: boolean;
  has_video: boolean;
}

interface PipelineState {
  project_id: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  overall_progress: number;
  current_stage: string;
  message: string;
  stages: Record<string, StageStatus>;
  error?: string | null;
  result?: PipelineResult;
  clips?: Clip[];
}

const STAGE_ORDER = [
  'screenwriting',
  'prompt_engineering',
  'storyboard',
  'narration',
  'video',
  'assembly',
] as const;

const STAGE_META: Record<string, { label: string; description: string; emoji: string }> = {
  screenwriting:      { label: 'Agente Guionista',       description: 'Genera historia estructurada y divide en escenas', emoji: '✍' },
  prompt_engineering: { label: 'Ingeniería de Prompts',  description: 'Convierte escenas en prompts técnicos para video', emoji: '⚡' },
  storyboard:         { label: 'Storyboard Visual',      description: 'Genera imágenes de previsualización', emoji: '🎨' },
  narration:          { label: 'Narración — ElevenLabs', description: 'Genera voice-over en español para cada escena', emoji: '🎙' },
  video:              { label: 'Video — Kling AI',        description: 'Genera clips de video cinematográficos con IA', emoji: '🎬' },
  assembly:           { label: 'Ensamblaje',             description: 'Compila resultados y prepara descarga', emoji: '🎞' },
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-400" />;
  if (status === 'in_progress') return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
  if (status === 'failed') return <AlertCircle className="w-5 h-5 text-destructive" />;
  return <Clock className="w-5 h-5 text-muted-foreground opacity-40" />;
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || '0', 10);

  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${PYTHON_API}/pipeline-status/${projectId}`);
        if (!res.ok) throw new Error('Error de conexión');
        const data: PipelineState = await res.json();
        setPipeline(data);
        setConnectionError(null);
        if (data.status === 'completed' || data.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        setConnectionError('No se puede conectar al servidor Python (puerto 8000).');
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    };

    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 2500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId]);

  const overallProgress = pipeline?.overall_progress ?? 0;
  const pipelineStatus = pipeline?.status ?? 'not_started';
  const clips: Clip[] = pipeline?.result?.clips ?? pipeline?.clips ?? [];
  const videoClips = clips.filter((c) => c.video_url);
  const audioClips = clips.filter((c) => c.audio_url);

  const completedCount = STAGE_ORDER.filter((s) => pipeline?.stages[s]?.status === 'completed').length;
  const activeCount = STAGE_ORDER.filter((s) => pipeline?.stages[s]?.status === 'in_progress').length;
  const pendingCount = STAGE_ORDER.filter((s) => !pipeline?.stages[s] || pipeline.stages[s].status === 'pending').length;
  const logs: string[] = (pipeline as any)?.logs ?? [];

  let statusLabel = 'Iniciando...';
  if (pipelineStatus === 'completed') statusLabel = 'Completado';
  else if (pipelineStatus === 'failed') statusLabel = 'Falló';
  else if (pipelineStatus === 'in_progress') statusLabel = 'Generando...';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">Proyecto #{projectId}</h1>
              <p className="text-sm text-muted-foreground">{statusLabel}</p>
            </div>
          </div>
          {pipelineStatus === 'completed' && (
            <div className="flex gap-2">
              {audioClips.length > 0 && (
                <Button
                  className="btn-neon-cyan"
                  size="sm"
                  onClick={() => {
                    audioClips.forEach((c, i) => {
                      if (c.audio_url) {
                        setTimeout(() => downloadUrl(c.audio_url!, `audio_escena_${c.scene}.mp3`), i * 400);
                      }
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Audios ({audioClips.length})
                </Button>
              )}
              {videoClips.length > 0 && (
                <Button
                  className="btn-neon"
                  size="sm"
                  onClick={() => {
                    videoClips.forEach((c, i) => {
                      if (c.video_url) {
                        setTimeout(() => downloadUrl(c.video_url!, `clip_escena_${c.scene}.mp4`), i * 500);
                      }
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Videos ({videoClips.length})
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Connection error */}
        {connectionError && (
          <Card className="card-neon border-destructive/50 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-destructive mb-1">Error de conexión</p>
                <p className="text-sm text-muted-foreground mb-2">{connectionError}</p>
                <p className="text-sm text-muted-foreground">
                  Ejecuta:{' '}
                  <code className="bg-muted/20 px-2 py-0.5 rounded text-xs font-mono">
                    python -m uvicorn server.agents.api:app --reload --port 8000
                  </code>
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress */}
            <Card className="card-neon p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Progreso General</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completado</span>
                  <span className="text-primary font-bold">{overallProgress}%</span>
                </div>
                <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pipeline?.message ?? 'Esperando datos del servidor...'}
              </p>
            </Card>

            {/* Stats */}
            <Card className="card-neon-cyan p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-secondary">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Listas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Activas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </Card>

            {/* API Status */}
            <Card className="card-neon p-4">
              <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">APIs Activas</p>
              <div className="space-y-2">
                {[
                  { label: 'ElevenLabs (Voz)', active: true },
                  { label: 'Kling AI (Video)', active: true },
                  { label: 'OpenAI (Guion)', active: false },
                ].map((api) => (
                  <div key={api.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{api.label}</span>
                    <span className={api.active ? 'text-green-400' : 'text-muted-foreground/50'}>
                      {api.active ? '✓ Activo' : '— Demo'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Pipeline Multi-Agente
            </h2>

            {STAGE_ORDER.map((stageKey, idx) => {
              const meta = STAGE_META[stageKey];
              const stageData = pipeline?.stages[stageKey];
              const stageStatus = stageData?.status ?? 'pending';
              const stageProgress = stageData?.progress ?? 0;
              const isActive = stageStatus === 'in_progress';
              const isDone = stageStatus === 'completed';

              let cardClass = 'card-neon opacity-50';
              if (isDone) cardClass = 'card-neon-cyan';
              else if (isActive) cardClass = 'card-neon ring-1 ring-primary/50';

              let numberClass =
                'shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ' +
                'bg-muted/10 border-border/40 text-muted-foreground';
              if (isDone) numberClass = 'shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border bg-green-400/10 border-green-400/50 text-green-400';
              else if (isActive) numberClass = 'shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border bg-primary/10 border-primary/50 text-primary';

              return (
                <Card key={stageKey} className={`p-6 transition-all duration-300 ${cardClass}`}>
                  <div className="flex items-start gap-4">
                    <div className={numberClass}>
                      {isDone ? '✓' : String(idx + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meta.emoji}</span>
                          <h3 className={`font-bold ${isDone ? 'text-secondary' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            {meta.label}
                          </h3>
                        </div>
                        <StatusBadge status={stageStatus} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{meta.description}</p>
                      {(isActive || isDone) && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {isActive ? 'Procesando...' : 'Completado'}
                            </span>
                            <span className={isDone ? 'text-secondary' : 'text-primary'}>
                              {isDone ? '100' : String(stageProgress)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-secondary' : 'bg-primary'}`}
                              style={{ width: `${isDone ? 100 : stageProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* ── Live Logs ── */}
            {logs.length > 0 && (
              <Card className="card-neon p-4 mt-2">
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                  Logs en vivo
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
                  {logs.map((log, i) => {
                    const isError = log.includes('FALLO') || log.includes('error') || log.includes('❌');
                    const isOk = log.includes('OK') || log.includes('✅') || log.includes('completado');
                    return (
                      <p
                        key={i}
                        className={
                          isError ? 'text-destructive' :
                          isOk ? 'text-green-400' :
                          'text-muted-foreground'
                        }
                      >
                        {log}
                      </p>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── Clips Generados ── */}
            {pipelineStatus === 'completed' && (
              <div className="mt-8 space-y-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Clips Generados — {pipeline?.result?.story_title ?? 'Tu Historia'}
                </h2>

                {pipeline?.result?.synopsis && (
                  <Card className="card-neon p-4">
                    <p className="text-sm text-muted-foreground italic">{pipeline.result.synopsis}</p>
                  </Card>
                )}

                {clips.length === 0 && (
                  <Card className="card-neon p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      No se generaron clips. Verifica que las claves de Kling AI y ElevenLabs
                      estén configuradas correctamente en el <code className="text-xs bg-muted/20 px-1 rounded">.env</code>.
                    </p>
                  </Card>
                )}

                {clips.map((clip) => (
                  <Card key={clip.scene} className="card-neon p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-primary mb-1">
                          Escena {clip.scene} — {clip.title}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className={clip.video_url ? 'text-green-400' : 'text-muted-foreground/50'}>
                            {clip.video_url ? '🎬 Video listo' : '🎬 Sin video'}
                          </span>
                          <span className={clip.audio_url ? 'text-secondary' : 'text-muted-foreground/50'}>
                            {clip.audio_url ? '🎙 Audio listo' : '🎙 Sin audio'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {clip.video_url && (
                          <Button
                            size="sm"
                            className="btn-neon"
                            onClick={() => downloadUrl(clip.video_url!, `clip_escena_${clip.scene}.mp4`)}
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Button>
                        )}
                        {clip.audio_url && (
                          <Button
                            size="sm"
                            className="btn-neon-cyan"
                            onClick={() => downloadUrl(clip.audio_url!, `audio_escena_${clip.scene}.mp3`)}
                          >
                            <Music className="w-3 h-3 mr-1" />
                            Audio
                          </Button>
                        )}
                        {clip.video_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border/40 text-muted-foreground"
                            onClick={() => window.open(clip.video_url!, '_blank')}
                          >
                            Ver
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Failed state */}
            {pipelineStatus === 'failed' && (
              <Card className="card-neon border-destructive/50 p-6 mt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-destructive mb-1">El pipeline falló</p>
                    <p className="text-sm text-muted-foreground">{pipeline?.error ?? 'Error desconocido'}</p>
                    <Link href="/projects/new">
                      <Button className="btn-neon mt-4" size="sm">Crear nuevo proyecto</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
