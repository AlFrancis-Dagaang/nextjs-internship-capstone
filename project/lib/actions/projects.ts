"use server";

import { queries } from "@/lib/db";
import { projectCreateSchema, projectUpdateSchema } from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertProjectOwnership } from "@/lib/services/ownership";
import { Project } from "../db/schema";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createProject(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.projects.create>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const project = await queries.projects.create({
    ...parsed.data,
    ownerId: authResult.user.id,
  });

  return { success: true, data: project };
}

export async function getProjects(): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.projects.getByOwner>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const projects = await queries.projects.getByOwner(authResult.user.id);
  return { success: true, data: projects };
}

export async function getProject(id: string): Promise<ActionResult<Project>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const ownership = await assertProjectOwnership(id, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  return { success: true, data: ownership.project };
}

export async function updateProject(
  id: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.projects.update>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = projectUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ownership = await assertProjectOwnership(id, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const updated = await queries.projects.update(id, parsed.data);
  return { success: true, data: updated };
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const ownership = await assertProjectOwnership(id, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  await queries.projects.delete(id);
  return { success: true, data: null };
}
