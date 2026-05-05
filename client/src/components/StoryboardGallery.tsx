import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, Volume2 } from 'lucide-react';

export interface StoryboardScene {
  id: number;
  sceneNumber: number;
  title: string;
  description: string;
  dialogue: string;
  mood: string;
  durationSeconds: number;
  imageUrl?: string;
  audioUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

interface StoryboardGalleryProps {
  scenes: StoryboardScene[];
  onSceneSelect?: (scene: StoryboardScene) => void;
}

export const StoryboardGallery: React.FC<StoryboardGalleryProps> = ({ scenes, onSceneSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedScene = scenes[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? scenes.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === scenes.length - 1 ? 0 : prev + 1));
  };

  if (scenes.length === 0) {
    return (
      <Card className="card-neon p-12 text-center">
        <p className="text-muted-foreground">No hay escenas disponibles</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Viewer */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-background/95 backdrop-blur' : ''}`}>
        <Card className={`card-neon overflow-hidden ${isFullscreen ? 'h-screen' : ''}`}>
          {/* Image Container */}
          <div className={`relative bg-black/50 ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
            {selectedScene.imageUrl ? (
              <img
                src={selectedScene.imageUrl}
                alt={selectedScene.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-muted-foreground">
                    {selectedScene.status === 'generating' && 'Generando imagen...'}
                    {selectedScene.status === 'pending' && 'Pendiente de generación'}
                    {selectedScene.status === 'failed' && 'Error en la generación'}
                    {selectedScene.status === 'completed' && !selectedScene.imageUrl && 'Sin imagen'}
                  </p>
                </div>
              </div>
            )}

            {/* Scene Info Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-primary">
                    Escena {selectedScene.sceneNumber}: {selectedScene.title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors"
                      title="Pantalla completa"
                    >
                      <Maximize2 className="w-5 h-5 text-primary" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Duración: {Math.floor(selectedScene.durationSeconds / 60)}:{String(selectedScene.durationSeconds % 60).padStart(2, '0')} | Mood: {selectedScene.mood}
                </p>
              </div>
            </div>

            {/* Navigation Arrows */}
            {!isFullscreen && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors z-10"
                  aria-label="Escena anterior"
                >
                  <ChevronLeft className="w-6 h-6 text-primary" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors z-10"
                  aria-label="Siguiente escena"
                >
                  <ChevronRight className="w-6 h-6 text-primary" />
                </button>
              </>
            )}

            {/* Scene Counter */}
            <div className="absolute top-4 right-4 badge-neon">
              {selectedIndex + 1} / {scenes.length}
            </div>
          </div>

          {/* Scene Details */}
          {!isFullscreen && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-secondary mb-2">Descripción</h3>
                <p className="text-sm text-muted-foreground">{selectedScene.description}</p>
              </div>

              {selectedScene.dialogue && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary mb-2">Diálogo</h3>
                  <p className="text-sm text-muted-foreground italic">
                    "{selectedScene.dialogue}"
                  </p>
                </div>
              )}

              {/* Audio Player */}
              {selectedScene.audioUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <Volume2 className="w-4 h-4" />
                    Narración
                  </div>
                  <audio
                    controls
                    src={selectedScene.audioUrl}
                    className="w-full"
                    style={{
                      filter: 'brightness(1.2)',
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => onSceneSelect?.(selectedScene)}
                  className="btn-neon-cyan flex-1"
                >
                  Ver Detalles
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Close Fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors text-primary font-semibold"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {!isFullscreen && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Todas las Escenas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-x-auto pb-2">
            {scenes.map((scene, index) => (
              <button
                key={scene.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-primary neon-shadow'
                    : 'border-muted/30 hover:border-primary/50'
                }`}
              >
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Escena ${scene.sceneNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">
                      {scene.sceneNumber}
                    </span>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="absolute bottom-1 right-1">
                  {scene.status === 'completed' && (
                    <div className="w-3 h-3 rounded-full bg-secondary neon-shadow-cyan" />
                  )}
                  {scene.status === 'generating' && (
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  )}
                  {scene.status === 'failed' && (
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
