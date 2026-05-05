import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Sparkles, Loader2 } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: {
    title: string;
    idea: string;
    numClips: number;
    clipDuration: number;
    referenceImage?: File;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, isLoading = false }) => {
  const [title, setTitle] = useState('');
  const [idea, setIdea] = useState('');
  const [numClips, setNumClips] = useState(5);
  const [clipDuration, setClipDuration] = useState(60);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !idea.trim()) {
      alert('Por favor completa el título y la idea');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        idea,
        numClips,
        clipDuration,
        referenceImage: referenceImage || undefined,
      });
      // Reset form on success
      setTitle('');
      setIdea('');
      setNumClips(5);
      setClipDuration(60);
      setReferenceImage(null);
      setPreviewUrl(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
             <Sparkles className="w-8 h-8 text-primary" />
             <h1 className="text-4xl md:text-5xl font-bold">
              Crear Proyecto
            </h1>
             <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">
            Transforma tu idea en una serie de clips de video cinematográficos
          </p>
        </div>

        {/* Form Card */}
        <Card className="card-neon">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Section */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground font-semibold">
                Título del Proyecto
              </Label>
              <Input
                id="title"
                placeholder="Ej: Noche en la Metrópolis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-neon"
                disabled={isSubmitting || isLoading}
              />
            </div>

            {/* Idea/Script Section */}
            <div className="space-y-2">
              <Label htmlFor="idea" className="text-foreground font-semibold">
                Idea, Guion o Descripción
              </Label>
              <Textarea
                id="idea"
                placeholder="Describe tu idea, proporciona un guion o una descripción detallada de lo que quieres generar..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="input-neon min-h-32"
                disabled={isSubmitting || isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Cuanto más detallado sea, mejor será el resultado
              </p>
            </div>

            {/* Configuration Grid */}
            <div className="space-y-6">
              {/* Number of Clips */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-semibold">Número de Clips</Label>
                  <span className="text-primary font-bold text-lg">{numClips} clips</span>
                </div>
                {/* Quick presets */}
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumClips(n)}
                      disabled={isSubmitting || isLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                        numClips === n
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                          : 'bg-muted/10 text-muted-foreground border-border/40 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={numClips}
                    onChange={(e) => setNumClips(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="input-neon w-20 text-center"
                    disabled={isSubmitting || isLoading}
                    placeholder="Custom"
                  />
                </div>
              </div>

              {/* Clip Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-semibold">Duración por Escena</Label>
                  <span className="text-primary font-bold text-lg">
                    {clipDuration >= 60
                      ? `${Math.floor(clipDuration / 60)}:${String(clipDuration % 60).padStart(2, '0')} min`
                      : `${clipDuration}s`}
                  </span>
                </div>
                {/* Quick presets */}
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setClipDuration(d)}
                      disabled={isSubmitting || isLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                        clipDuration === d
                          ? 'bg-secondary text-secondary-foreground border-secondary shadow-lg shadow-secondary/30'
                          : 'bg-muted/10 text-muted-foreground border-border/40 hover:border-secondary/50 hover:text-secondary'
                      }`}
                    >
                      {d >= 60 ? `${d / 60}min` : `${d}s`}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={clipDuration}
                  onChange={(e) => setClipDuration(parseInt(e.target.value))}
                  disabled={isSubmitting || isLoading}
                  className="w-full accent-secondary cursor-pointer"
                />
              </div>

              {/* Total duration summary */}
              <div className="p-4 rounded-lg bg-muted/10 border border-border/30 flex items-center justify-between">
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground">Resumen del proyecto</p>
                  <p>{numClips} clips × {clipDuration}s = <span className="text-primary font-bold">
                    {Math.floor((numClips * clipDuration) / 60)}:{String((numClips * clipDuration) % 60).padStart(2, '0')} min total
                  </span></p>
                  <p className="text-xs">Video generado: ~{numClips * 10}s con Runway (10s/clip)</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="text-secondary font-bold text-lg">{numClips}</p>
                  <p>escenas</p>
                </div>
              </div>
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                Imagen de Referencia (Opcional)
              </Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="imageInput"
                  disabled={isSubmitting || isLoading}
                />
                <label
                  htmlFor="imageInput"
                  className="block p-8 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/60 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Upload className="w-8 h-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">
                        {referenceImage ? referenceImage.name : 'Arrastra una imagen aquí'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="mt-4 relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg border border-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceImage(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm hover:bg-destructive/90"
                    disabled={isSubmitting || isLoading}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card-neon-cyan p-4 space-y-2">
              <h3 className="text-sm font-semibold text-secondary">Resumen del Proyecto</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">Duración total:</span>{' '}
                  {Math.round((numClips * clipDuration) / 60)} minutos{' '}
                  {Math.round((numClips * clipDuration) % 60)} segundos
                </p>
                <p>
                  <span className="text-foreground font-medium">Escenas:</span> {numClips}
                </p>
                <p>
                  <span className="text-foreground font-medium">Referencia visual:</span>{' '}
                  {referenceImage ? 'Incluida' : 'No incluida'}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                className="btn-neon flex-1"
                disabled={isSubmitting || isLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting || isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{isSubmitting || isLoading ? 'Generando...' : 'Crear Proyecto'}</span>
                </span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-neon p-6 text-center">
            <h3 className="text-secondary font-bold mb-2">Guionista IA</h3>
            <p className="text-sm text-muted-foreground">
              Genera historias estructuradas y divididas en escenas
            </p>
          </div>
          <div className="card-neon p-6 text-center">
            <h3 className="text-secondary font-bold mb-2">Ingeniería de Prompts</h3>
            <p className="text-sm text-muted-foreground">
              Optimiza cada escena para máxima calidad visual
            </p>
          </div>
          <div className="card-neon p-6 text-center">
            <h3 className="text-secondary font-bold mb-2">Narración Sincronizada</h3>
            <p className="text-sm text-muted-foreground">
              Voice-over coherente con ElevenLabs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
