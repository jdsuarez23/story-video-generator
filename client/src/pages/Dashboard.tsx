import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Film, Plus, Play, Settings, LogOut } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Proyecto Demo 1',
      status: 'completed',
      progress: 100,
      createdAt: '2026-05-04',
    },
    {
      id: 2,
      title: 'Proyecto en Progreso',
      status: 'in_progress',
      progress: 65,
      createdAt: '2026-05-05',
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border/40 p-6 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Film className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-primary">Story Video Gen</h1>
        </div>

        {/* User Profile */}
        <div className="mb-8 p-4 rounded-lg bg-muted/20 border border-border/40">
          <p className="text-sm font-semibold text-foreground mb-1">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/20 text-primary font-semibold hover:bg-primary/30 transition-colors">
              <Film className="w-5 h-5" />
              Mis Proyectos
            </button>
          </Link>
          <Link href="/projects/new">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors">
              <Plus className="w-5 h-5" />
              Crear Proyecto
            </button>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors">
            <Settings className="w-5 h-5" />
            Configuración
          </button>
        </nav>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Mis Proyectos</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos de generación de video</p>
        </div>

        {/* Create Project Button */}
        <div className="mb-8">
          <Link href="/projects/new">
            <Button className="btn-neon">
              <Plus className="w-5 h-5 mr-2" />
              Crear Nuevo Proyecto
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="card-neon p-6 hover:neon-shadow transition-all cursor-pointer h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-1">{project.title}</h3>
                    <p className="text-xs text-muted-foreground">{project.createdAt}</p>
                  </div>
                  <Play className="w-5 h-5 text-secondary" />
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {project.status === 'completed' && (
                    <span className="badge-neon-cyan text-xs">Completado</span>
                  )}
                  {project.status === 'in_progress' && (
                    <span className="badge-neon text-xs">En Progreso</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="text-primary font-semibold">{project.progress}%</span>
                  </div>
                  <div className="progress-neon h-2">
                    <div
                      className="progress-neon-fill h-2"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <button className="w-full px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-semibold">
                    Ver Detalles
                  </button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <Card className="card-neon p-12 text-center">
            <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground mb-6">
              Crea tu primer proyecto para comenzar a generar videos cinematográficos
            </p>
            <Link href="/projects/new">
              <Button className="btn-neon">
                <Plus className="w-5 h-5 mr-2" />
                Crear Proyecto
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
