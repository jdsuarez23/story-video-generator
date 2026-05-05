import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Film, Sparkles, Zap, Volume2, Image as ImageIcon, Play } from 'lucide-react';
import { Link } from 'wouter';

export default function Home() {

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Story Video Gen</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button className="btn-neon">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 inline-block">
            <span className="badge-neon text-sm">✨ Generación Multi-Agente con IA</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Transforma Ideas en
            <br />
            <span className="text-gradient">Videos Cinematográficos</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Utiliza nuestro sistema multi-agente impulsado por IA para convertir tu idea, guion o imagen en una serie de clips de video profesionales con narración sincronizada y estética neon-noir.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/projects/new">
              <Button className="btn-neon text-lg px-8 py-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="btn-neon-cyan text-lg px-8 py-6">
                <Play className="w-5 h-5 mr-2" />
                Mis Proyectos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Pipeline Multi-Agente</h2>
            <p className="text-lg text-muted-foreground">Orquestación inteligente de agentes especializados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="card-neon p-8 hover:neon-shadow transition-all">
              <div className="mb-4 inline-block p-3 rounded-lg bg-primary opacity-10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Agente Guionista</h3>
              <p className="text-muted-foreground">
                Genera historias estructuradas y las divide en escenas coherentes basadas en tu idea
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="card-neon p-8 hover:neon-shadow transition-all">
              <div className="mb-4 inline-block p-3 rounded-lg bg-secondary opacity-10">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Ingeniería de Prompts</h3>
              <p className="text-muted-foreground">
                Optimiza cada escena con prompts técnicos para máxima calidad visual
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="card-neon p-8 hover:neon-shadow transition-all">
              <div className="mb-4 inline-block p-3 rounded-lg bg-accent opacity-10">
                <ImageIcon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-accent mb-2">Storyboard Visual</h3>
              <p className="text-muted-foreground">
                Previsualiza cada escena antes de generar el video final
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="card-neon-cyan p-8 hover:neon-shadow-cyan transition-all">
              <div className="mb-4 inline-block p-3 rounded-lg bg-secondary opacity-10">
                <Volume2 className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Narración Sincronizada</h3>
              <p className="text-muted-foreground">
                Voice-over coherente generado con ElevenLabs
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="card-neon p-8 hover:neon-shadow transition-all">
              <div className="mb-4 inline-block p-3 rounded-lg bg-primary opacity-10">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Generación de Video</h3>
              <p className="text-muted-foreground">
                Clips de video cinematográficos con consistencia visual
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="card-neon-cyan p-8 hover:neon-shadow-cyan transition-all">
              <div className="mb-4 inline-block p-3 rounded-lg bg-secondary opacity-10">
                <Film className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Ensamblaje Final</h3>
              <p className="text-muted-foreground">
                Video completo sincronizado y listo para compartir
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 border-t border-border/40 bg-muted/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Cómo Funciona</h2>
            <p className="text-lg text-muted-foreground">Tres pasos simples para crear tu video</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mb-6 inline-block w-16 h-16 rounded-full bg-primary opacity-20 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Ingresa tu Idea</h3>
              <p className="text-muted-foreground">
                Proporciona tu idea, guion o descripción, junto con el número de clips y duración deseada
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mb-6 inline-block w-16 h-16 rounded-full bg-secondary opacity-20 flex items-center justify-center">
                <span className="text-3xl font-bold text-secondary">2</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Pipeline Automático</h3>
              <p className="text-muted-foreground">
                Nuestros agentes generan la historia, optimizan prompts, crean storyboards y narración
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mb-6 inline-block w-16 h-16 rounded-full bg-accent opacity-20 flex items-center justify-center">
                <span className="text-3xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Descarga tu Video</h3>
              <p className="text-muted-foreground">
                Obtén tu video cinematográfico completo con todos los clips sincronizados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center card-neon p-12 md:p-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Comienza Ahora</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Crea tu primer proyecto de video cinematográfico con IA
          </p>
          <Link href="/projects/new">
            <Button className="btn-neon text-lg px-8 py-6">
              <Sparkles className="w-5 h-5 mr-2" />
              Crear Proyecto
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-muted/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>© 2026 Story Video Generator. Powered by CrewAI & Manus.</p>
        </div>
      </footer>
    </div>
  );
}
