"use server";

import { queries } from "@/lib/db";
import { eventCreateSchema, eventUpdateSchema } from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertProjectEditAccess,
  assertProjectViewAccess,
} from "@/lib/services/ownership";
import { revalidatePath } from "next/cache";
import { notifyProjectMembers } from "../services/notifications";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createEvent(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.events.create>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = eventCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let projectName: string | undefined;

  if (parsed.data.projectId) {
    const access = await assertProjectEditAccess(
      parsed.data.projectId,
      authResult.user.id,
    );
    if ("error" in access) {
      return { success: false, error: access.error ?? "Unknown error" };
    }
    projectName = access.project.name;
  }

  const event = await queries.events.create({
    ...parsed.data,
    creatorId: authResult.user.id,
  });

  // Notify all project members on create only (per your answer —
  // update/delete deliberately don't notify). Skipped entirely for
  // personal events, which have no members to notify.
  if (parsed.data.projectId && projectName) {
    const actor = await queries.users.getById(authResult.user.id);
    await notifyProjectMembers({
      projectId: parsed.data.projectId,
      type: "project_event_added",
      message: `${actor?.name ?? "Someone"} added an event "${event.title}" to "${projectName}"`,
      actorId: authResult.user.id,
    });
  }

  revalidatePath("/calendar");
  return { success: true, data: event };
}

export async function getEvents(): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.events.getForUser>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const events = await queries.events.getForUser(authResult.user.id);
  return { success: true, data: events };
}

export async function updateEvent(
  id: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.events.update>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existing = await queries.events.getById(id);
  if (!existing) return { success: false, error: "Not found" };

  if (existing.projectId) {
    const access = await assertProjectEditAccess(
      existing.projectId,
      authResult.user.id,
    );
    if ("error" in access) {
      return { success: false, error: access.error ?? "Unknown error" };
    }
  } else if (existing.creatorId !== authResult.user.id) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = eventUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const updated = await queries.events.update(id, parsed.data);
  revalidatePath("/calendar");
  return { success: true, data: updated };
}

export async function deleteEvent(id: string): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existing = await queries.events.getById(id);
  if (!existing) return { success: false, error: "Not found" };

  if (existing.projectId) {
    const access = await assertProjectEditAccess(
      existing.projectId,
      authResult.user.id,
    );
    if ("error" in access) {
      return { success: false, error: access.error ?? "Unknown error" };
    }
  } else if (existing.creatorId !== authResult.user.id) {
    return { success: false, error: "Forbidden" };
  }

  await queries.events.delete(id);
  revalidatePath("/calendar");
  return { success: true, data: null };
}

export async function getEventableProjects(): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.projects.getEditableByUser>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const projects = await queries.projects.getEditableByUser(authResult.user.id);
  return { success: true, data: projects };
}

// View access (not edit) — anyone who can see the project (owner,
// editor, or viewer) should be able to see its events; editability is
// enforced separately, inside EventFormModal's canEdit + the real
// server-side check on update/delete.
export async function getProjectEvents(
  projectId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.events.getByProject>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  // 💡 Handle the virtual My Tasks board gracefully
  if (projectId === "my-tasks") {
    const events = await queries.events.getForUser(authResult.user.id);
    return { success: true, data: events as any };
  }

  const access = await assertProjectViewAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const events = await queries.events.getByProject(projectId);
  return { success: true, data: events };
}
