// stores/project-store.ts
import { create } from "zustand";
import type { Project } from "@/lib/db/schema";

export type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  imageUrl?: string | null;
  hasImage?: boolean;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
};

interface ProjectState {
  projects: Project[];
  membersMap: Record<string, Member[]>;
  addMember: (projectId: string, member: Member) => void;
  replaceOptimisticMember: (
    projectId: string,
    tempId: string,
    realMember: Member,
  ) => void;
  updateMemberLocal: (projectId: string, member: Member) => void;
  removeMember: (projectId: string, memberId: string) => void;

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
  addMember: (projectId, member) =>
    set((s) => ({
      membersMap: {
        ...s.membersMap,
        [projectId]: [...(s.membersMap[projectId] ?? []), member],
      },
    })),

  // Mirrors replaceOptimisticTask: swaps a temp-id member (from an
  // optimistic invite) for the server-confirmed row once addProjectMember
  // resolves.
  replaceOptimisticMember: (projectId, tempId, realMember) =>
    set((s) => ({
      membersMap: {
        ...s.membersMap,
        [projectId]: (s.membersMap[projectId] ?? []).map((m) =>
          m.id === tempId ? realMember : m,
        ),
      },
    })),

  updateMemberLocal: (projectId, member) =>
    set((s) => ({
      membersMap: {
        ...s.membersMap,
        [projectId]: (s.membersMap[projectId] ?? []).map((m) =>
          m.id === member.id ? member : m,
        ),
      },
    })),

  removeMember: (projectId, memberId) =>
    set((s) => ({
      membersMap: {
        ...s.membersMap,
        [projectId]: (s.membersMap[projectId] ?? []).filter(
          (m) => m.id !== memberId,
        ),
      },
    })),
}));
