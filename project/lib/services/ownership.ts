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
  console.log("DEBUG assertProjectAccess", { projectId, userId, membership }); // temp

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
 */
export async function assertProjectViewAccess(
  projectId: string,
  userId: string,
) {
  return assertProjectAccess(projectId, userId);
}

/**
 * Edit access: owner or editor only, per the permission matrix.
 * Viewer is explicitly rejected here even though they have project
 * access.
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

/**
 * List-scoped view access: resolves list -> project, then defers to
 * assertProjectViewAccess (owner/editor/viewer all pass).
 */
export async function assertListViewAccess(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectViewAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

/**
 * List-scoped edit access: resolves list -> project, then defers to
 * assertProjectEditAccess (owner/editor pass, viewer rejected).
 */
export async function assertListEditAccess(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectEditAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

/**
 * Task-scoped view access: resolves task -> list -> project, then
 * defers to assertProjectViewAccess (owner/editor/viewer all pass).
 */
export async function assertTaskViewAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListViewAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}

/**
 * Task-scoped edit access: resolves task -> list -> project, then
 * defers to assertProjectEditAccess (owner/editor pass, viewer rejected).
 */
export async function assertTaskEditAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListEditAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}
