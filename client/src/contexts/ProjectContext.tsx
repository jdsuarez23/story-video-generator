import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Scene {
  id: number;
  sceneNumber: number;
  title: string;
  description: string;
  dialogue: string;
  mood: string;
  durationSeconds: number;
  storyboardImageUrl?: string;
  narrationAudioUrl?: string;
  videoClipUrl?: string;
  status: 'PENDING' | 'PROMPTS_READY' | 'STORYBOARD_GENERATED' | 'NARRATION_GENERATED' | 'VIDEO_GENERATED' | 'COMPLETED';
}

export interface Project {
  id: number;
  title: string;
  synopsis?: string;
  status: 'CREATED' | 'STRUCTURED' | 'PROMPTS_GENERATED' | 'STORYBOARD_GENERATED' | 'NARRATION_GENERATED' | 'VIDEO_GENERATED' | 'COMPLETED' | 'FAILED';
  finalVideoUrl?: string;
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  updateProjectStatus: (projectId: number, status: Project['status']) => void;
  updateSceneStatus: (projectId: number, sceneId: number, status: Scene['status']) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProjectStatus = (projectId: number, status: Project['status']) => {
    setCurrentProject((prev) => {
      if (!prev || prev.id !== projectId) return prev;
      return { ...prev, status };
    });

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
  };

  const updateSceneStatus = (projectId: number, sceneId: number, status: Scene['status']) => {
    setCurrentProject((prev) => {
      if (!prev || prev.id !== projectId) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, status } : s)),
      };
    });
  };

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject,
    projects,
    setProjects,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateProjectStatus,
    updateSceneStatus,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
