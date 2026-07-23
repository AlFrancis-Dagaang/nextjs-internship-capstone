"use server";

import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validations";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function getAuthedUserOrError() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" } as const;

  const user = await queries.users.getByClerkId(userId);
  if (!user) return { error: "User record not found" } as const;

  return { user } as const;
}

/**
 * Tasks have no ownerId of their own, and are one level further removed
 * than lists were in #16: task -> listId -> list.projectId -> project.ownerId.
 * Both hops have to be walked and checked.
 */
async function assertListOwnership(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const project = await queries.projects.getById(list.projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;

  return { list, project } as const;
}

/**
 * assigneeId rule (per #12/#14 design, made concrete in #17): identity-derived
 * ownerId is never client input, but assigneeId is — however there is no
 * project-membership concept yet (#29, unstarted), so until then the only
 * valid assignee for a project is that project's own owner. `assignToMe`
 * lets the client toggle this without ever needing to know its own DB user
 * id (only Clerk's id is available client-side). A directly-supplied
 * assigneeId is still checked against the same rule, in case anything ever
 * calls this action without going through the toggle UI.
 */
function resolveAssigneeId(
  requestedAssigneeId: string | null | undefined,
  assignToMe: boolean | undefined,
  projectOwnerId: string,
): { ok: true; assigneeId: string | null } | { ok: false; error: string } {
  if (assignToMe) {
    return { ok: true, assigneeId: projectOwnerId };
  }
  if (requestedAssigneeId == null) {
    return { ok: true, assigneeId: null };
  }
  if (requestedAssigneeId !== projectOwnerId) {
    return { ok: false, error: "Invalid assignee" };
  }
  return { ok: true, assigneeId: requestedAssigneeId };
}

type CreateTaskInput = { assignToMe?: boolean } & Record<string, unknown>;

export async function createTask(
  rawInput: CreateTaskInput,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.tasks.create>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const { assignToMe, ...rest } = rawInput;
  const parsed = taskCreateSchema.safeParse(rest);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ownership = await assertListOwnership(
    parsed.data.listId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const assigneeResult = resolveAssigneeId(
    parsed.data.assigneeId,
    assignToMe,
    ownership.project.ownerId,
  );
  if (!assigneeResult.ok) {
    return { success: false, error: assigneeResult.error ?? "Unknown error" };
  }

  // Position is always computed server-side, same as #16 — append-only.
  const existingTasks = await queries.tasks.getByList(parsed.data.listId);
  const position = existingTasks.length;

  const task = await queries.tasks.create({
    title: parsed.data.title,
    description: parsed.data.description,
    listId: parsed.data.listId,
    assigneeId: assigneeResult.assigneeId,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate,
    position,
  });

  return { success: true, data: task };
}

export async function getTasksByList(
  listId: string,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.tasks.getByList>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const ownership = await assertListOwnership(listId, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const tasks = await queries.tasks.getByList(listId);
  return { success: true, data: tasks };
}

type UpdateTaskInput = { assignToMe?: boolean } & Record<string, unknown>;

export async function updateTask(
  id: string,
  rawInput: UpdateTaskInput,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.tasks.update>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const { assignToMe, ...rest } = rawInput;
  const parsed = taskUpdateSchema.safeParse(rest);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingTask = await queries.tasks.getById(id);
  if (!existingTask) {
    return { success: false, error: "Not found" };
  }

  const ownership = await assertListOwnership(
    existingTask.listId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  // `position` and `listId` are stripped even though taskUpdateSchema
  // (a .partial() of the create schema) technically allows them —
  // reordering/moving between lists is #21's job, not #17's.
  const {
    position: _ignoredPosition,
    listId: _ignoredListId,
    assigneeId: requestedAssigneeId,
    ...safeUpdate
  } = parsed.data;

  let finalAssigneeId = existingTask.assigneeId;
  if (assignToMe !== undefined || requestedAssigneeId !== undefined) {
    const assigneeResult = resolveAssigneeId(
      requestedAssigneeId,
      assignToMe,
      ownership.project.ownerId,
    );
    if (!assigneeResult.ok) {
      return { success: false, error: assigneeResult.error };
    }
    finalAssigneeId = assigneeResult.assigneeId;
  }

  const updated = await queries.tasks.update(id, {
    ...safeUpdate,
    assigneeId: finalAssigneeId,
  });
  return { success: true, data: updated };
}

export async function deleteTask(id: string): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existingTask = await queries.tasks.getById(id);
  if (!existingTask) {
    return { success: false, error: "Not found" };
  }

  const ownership = await assertListOwnership(
    existingTask.listId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  await queries.tasks.delete(id);
  return { success: true, data: null };
}

export async function moveTaskToList(
  taskId: string,
  newListId: string,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.tasks.update>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existingTask = await queries.tasks.getById(taskId);
  if (!existingTask) {
    return { success: false, error: "Not found" };
  }

  const sourceOwnership = await assertListOwnership(
    existingTask.listId,
    authResult.user.id,
  );
  if ("error" in sourceOwnership) {
    return { success: false, error: sourceOwnership.error ?? "Unknown error" };
  }

  if (existingTask.listId === newListId) {
    return { success: true, data: existingTask };
  }

  const destOwnership = await assertListOwnership(
    newListId,
    authResult.user.id,
  );
  if ("error" in destOwnership) {
    return { success: false, error: destOwnership.error ?? "Unknown error" };
  }

  if (sourceOwnership.list.projectId !== destOwnership.list.projectId) {
    return {
      success: false,
      error: "Cannot move a task to a list in a different project",
    };
  }

  // Append-only in destination list, same pattern as #16/#17.
  const destTasks = await queries.tasks.getByList(newListId);
  const position = destTasks.length;

  const updated = await queries.tasks.update(taskId, {
    listId: newListId,
    position,
  });
  return { success: true, data: updated };
}
