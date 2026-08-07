// stores/project-store.ts
import { create } from "zustand";
import type { Project } from "@/lib/db/schema";

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "editor" | "viewer";
};

interface ProjectState {
  projects: Project[];
  membersMap: Record<string, Member[]>;

  setInitialProjects: (projects: Project[]) => void;
  setInitialMembersMap: (map: Record<string, Member[]>) => void;
  addProject: (project: Project) => void;
  updateProjectLocal: (project: Project) => void;
  removeProject: (projectId: string) => void;
  replaceOptimisticProject: (tempId: string, realProject: Project) => void;
  setProjectMembers: (projectId: string, members: Member[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  membersMap: {},

  setInitialProjects: (projects) => set({ projects }),
  setInitialMembersMap: (membersMap) => set({ membersMap }),

  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),

  updateProjectLocal: (project) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === project.id ? project : p)),
    })),

  removeProject: (projectId) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) })),

  replaceOptimisticProject: (tempId, realProject) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === tempId ? realProject : p)),
    })),

  setProjectMembers: (projectId, members) =>
    set((s) => ({
      membersMap: { ...s.membersMap, [projectId]: members },
    })),
}));
