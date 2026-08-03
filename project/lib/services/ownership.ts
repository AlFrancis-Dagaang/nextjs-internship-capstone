import { queries } from "@/lib/db";

/**
 * Projects are directly owned — one check against ownerId.
 */
export async function assertProjectOwnership(
  projectId: string,
  userId: string,
) {
  const project = await queries.projects.getById(projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;
  return { project } as const;
}

/**
 * Lists have no ownerId of their own — ownership is indirect, via the
 * parent project. Every list-scoped action must resolve up to
 * project.ownerId.
 */
export async function assertListOwnership(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const project = await queries.projects.getById(list.projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;

  return { list, project } as const;
}

/**
 * Comments have no ownerId of their own. Access to a task's comments
 * requires the same project-ownership check as the task itself — this
 * is an access check (can this user see/post here), not the
 * author-only check used for deleting a specific comment.
 */
export async function assertTaskAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const ownership = await assertListOwnership(task.listId, userId);
  if ("error" in ownership) return ownership;

  return { task, list: ownership.list, project: ownership.project } as const;
}

/**
 * Role-aware project access check. Owner is resolved via projects.ownerId
 * (not a project_members row — #29 deliberately keeps ownership as the
 * single source of truth). Falls through to project_members for
 * everyone else.
 */
export async function assertProjectAccess(projectId: string, userId: string) {
  const project = await queries.projects.getById(projectId);
  if (!project) return { error: "Not found" } as const;

  if (project.ownerId === userId) {
    return { project, role: "owner" as const, isOwner: true } as const;
  }

  const membership = await queries.projectMembers.getByProjectAndUser(
    projectId,
    userId,
  );
  if (!membership) return { error: "Forbidden" } as const;

  return {
    project,
    role: membership.role,
    isOwner: false,
    membership,
  } as const;
}

/**
 * View access: owner, editor, or viewer — anyone with a role at all.
 * Alias over assertProjectAccess for call-site clarity (matrix: view
 * is the one row where all three roles are ✅).
 */
export async function assertProjectViewAccess(
  projectId: string,
  userId: string,
) {
  return assertProjectAccess(projectId, userId);
}

/**
 * Edit access: owner or editor only, per the permission matrix
 * (create/edit/move/delete tasks, comment, list CRUD, archive/restore).
 * Viewer is explicitly rejected here even though they have project
 * access — this is the check most existing task/list actions will
 * retrofit to.
 */
export async function assertProjectEditAccess(
  projectId: string,
  userId: string,
) {
  const access = await assertProjectAccess(projectId, userId);
  if ("error" in access) return access;
  if (access.role === "viewer") return { error: "Forbidden" } as const;
  return access;
}
