"use server";

import { auth, reverificationError } from "@clerk/nextjs/server";
import { queries } from "@/lib/db";
import { projectCreateSchema, projectUpdateSchema } from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertProjectOwnership,
  assertProjectManageAccess,
  assertProjectViewAccess,
} from "@/lib/services/ownership";
import { Project } from "../db/schema";
import { revalidatePath } from "next/cache";
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
import { publishProjectEvent } from "@/lib/realtime/server"; // ← add

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

  // Seed every new project with a standard Todo/In Progress/Done
  // structure + one sample task, so it isn't a blank board on first
  // load. No realtime publish needed here — nobody else can be
  // subscribed to this project's channel yet, since it didn't exist
  // until this line.
  const [todoList] = await Promise.all([
    queries.lists.create({ name: "Todo", projectId: project.id, position: 0 }),
    queries.lists.create({
      name: "In Progress",
      projectId: project.id,
      position: 1,
    }),
    queries.lists.create({ name: "Done", projectId: project.id, position: 2 }),
  ]);

  await queries.tasks.create({
    title: "Sample task",
    description: null,
    listId: todoList.id,
    assigneeId: null,
    priority: null,
    dueDate: null,
    position: 0,
  });

  revalidatePath("/projects");
  return { success: true, data: project };
}

export async function getProjects(): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.projects.getByOwnerOrMember>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const projects = await queries.projects.getByOwnerOrMember(
    authResult.user.id,
  );
  return { success: true, data: projects };
}

export async function getProject(id: string): Promise<ActionResult<Project>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectViewAccess(id, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  return { success: true, data: access.project };
}

export async function updateProject(
  id: string,
  input: unknown,
  originClientId?: string,
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

  const access = await assertProjectManageAccess(id, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const updated = await queries.projects.update(id, parsed.data);

  await publishProjectEvent(
    id,
    { type: "project_updated", project: updated },
    originClientId,
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true, data: updated };
}

export async function deleteProject(id: string) {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectManageAccess(id, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const { has } = await auth();
  if (!has({ reverification: "strict" })) {
    return reverificationError("strict");
  }

  await queries.projects.delete(id);
  revalidatePath("/projects");

  return { success: true, data: null };
}
