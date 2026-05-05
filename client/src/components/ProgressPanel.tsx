import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

interface ProgressPanelProps {
  stages: PipelineStage[];
  overallProgress: number;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({ stages, overallProgress }) => {
  const getStageIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-secondary" />;
      case 'in-progress':
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Circle className="w-6 h-6 text-muted" />;
    }
  };

  const getStageColor = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed':
        return 'border-secondary/30 bg-secondary/5';
      case 'in-progress':
        return 'border-primary/30 bg-primary/5 neon-border';
      case 'failed':
        return 'border-destructive/30 bg-destructive/5';
      default:
        return 'border-muted/20 bg-muted/5';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-foreground">Progreso General</h3>
          <span className="badge-neon">{overallProgress}%</span>
        </div>
        <div className="progress-neon">
          <div
            className="progress-neon-fill"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground">Etapas del Pipeline</h3>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.id}>
              <Card className={`p-4 border transition-all ${getStageColor(stage.status)}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStageIcon(stage.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">
                        {index + 1}. {stage.name}
                      </h4>
                      {stage.status === 'in-progress' && stage.progress !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {stage.progress}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stage.description}
                    </p>

                    {/* Stage Progress Bar */}
                    {stage.status === 'in-progress' && stage.progress !== undefined && (
                      <div className="progress-neon h-1">
                        <div
                          className="progress-neon-fill h-1"
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {stage.status === 'failed' && stage.error && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                        {stage.error}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {stage.status === 'completed' && (
                      <span className="badge-neon-cyan text-xs">Completado</span>
                    )}
                    {stage.status === 'in-progress' && (
                      <span className="badge-neon text-xs">En Progreso</span>
                    )}
                    {stage.status === 'failed' && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-bold uppercase bg-destructive/20 text-destructive border border-destructive/50">
                        Error
                      </span>
                    )}
                    {stage.status === 'pending' && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-bold uppercase bg-muted/20 text-muted-foreground border border-muted/50">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-primary/30 to-secondary/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Summary */}
      <Card className="card-neon-cyan p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-secondary">
              {stages.filter((s) => s.status === 'completed').length}
            </p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {stages.filter((s) => s.status === 'in-progress').length}
            </p>
            <p className="text-xs text-muted-foreground">En Progreso</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">
              {stages.filter((s) => s.status === 'pending').length}
            </p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">
              {stages.filter((s) => s.status === 'failed').length}
            </p>
            <p className="text-xs text-muted-foreground">Errores</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
