"use server";

import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db";
import { projectCreateSchema, projectUpdateSchema } from "@/lib/validations";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * All actions below re-derive the DB user row from the Clerk session on every
 * call rather than trusting a client-supplied id — ownerId is "identity-derived"
 * (see #14/#17 scope notes) and is never accepted as input.
 */

export async function createProject(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.projects.create>>>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await queries.users.getByClerkId(userId);
  if (!user) {
    return { success: false, error: "User record not found" };
  }

  const project = await queries.projects.create({
    ...parsed.data,
    ownerId: user.id,
  });

  return { success: true, data: project };
}

export async function getProjects(): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.projects.getByOwner>>>
> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await queries.users.getByClerkId(userId);
  if (!user) {
    return { success: false, error: "User record not found" };
  }

  const projects = await queries.projects.getByOwner(user.id);
  return { success: true, data: projects };
}

export async function getProject(
  id: string,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.projects.getById>>>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await queries.users.getByClerkId(userId);
  if (!user) {
    return { success: false, error: "User record not found" };
  }

  const project = await queries.projects.getById(id);
  if (!project) {
    return { success: false, error: "Not found" };
  }
  if (project.ownerId !== user.id) {
    return { success: false, error: "Forbidden" };
  }

  return { success: true, data: project };
}

export async function updateProject(
  id: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.projects.update>>>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = projectUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await queries.users.getByClerkId(userId);
  if (!user) {
    return { success: false, error: "User record not found" };
  }

  const existing = await queries.projects.getById(id);
  if (!existing) {
    return { success: false, error: "Not found" };
  }
  if (existing.ownerId !== user.id) {
    return { success: false, error: "Forbidden" };
  }

  const updated = await queries.projects.update(id, parsed.data);
  return { success: true, data: updated };
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await queries.users.getByClerkId(userId);
  if (!user) {
    return { success: false, error: "User record not found" };
  }

  const existing = await queries.projects.getById(id);
  if (!existing) {
    return { success: false, error: "Not found" };
  }
  if (existing.ownerId !== user.id) {
    return { success: false, error: "Forbidden" };
  }

  await queries.projects.delete(id);
  return { success: true, data: null };
}
