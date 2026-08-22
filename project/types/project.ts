export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  lists?: any[];
}

export type ProjectMemberRole = "admin" | "editor" | "contributor" | "viewer";
export type ProjectTeamRole = "editor" | "contributor" | "viewer";
export type EffectiveRole = "owner" | ProjectMemberRole;
export type MemberRole = EffectiveRole;

export interface ProjectMember {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  imageUrl?: string | null;
  hasImage?: boolean;
  role: "owner" | ProjectMemberRole;
}

export interface OwnerInfo {
  name?: string;
  email?: string;
  imageUrl?: string | null;
  hasImage?: boolean | null;
}

export interface CompletionInfo {
  total: number;
  completed: number;
}

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}

export interface ProjectTeam {
  id: string;
  projectId: string;
  teamId: string;
  role: ProjectTeamRole;
  createdAt: Date;
}
