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
