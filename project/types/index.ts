// TypeScript type definitions
// Task 1.3: Set up project structure and folder organization

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  lists: List[];
}

export interface List {
  id: string;
  name: string;
  projectId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  assigneeId?: string;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectMemberRole = "admin" | "editor" | "contributor" | "viewer";
export type ProjectTeamRole = "editor" | "contributor" | "viewer";
export type EffectiveRole = "owner" | ProjectMemberRole;

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

export type CalendarTaskDTO = {
  id: string;
  title: string;
  dueDate: string; // ISO string
  priority: "low" | "medium" | "high" | null;
  projectId: string;
  projectName: string;
  isCompleted: boolean;
};

export type CalendarEventDTO = {
  id: string;
  title: string;
  description: string | null;
  startAt: string; // ISO string
  endAt: string; // ISO string
  projectId: string | null;
  creatorId: string;
};

export type CalendarProjectDTO = {
  id: string;
  name: string;
  dueDate: string; // ISO string
};
// Note for interns: These types should match your database schema
// Update as needed when implementing the actual database schema
