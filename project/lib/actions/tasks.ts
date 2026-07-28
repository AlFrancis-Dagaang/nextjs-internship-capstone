"use server";

import { queries } from "@/lib/db";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertListOwnership } from "@/lib/services/ownership";
import { resolveAssigneeId } from "@/lib/services/assignee";
import { logTaskActivity } from "@/lib/services/activity";
import { Task } from "../db/schema";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

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
    return { success: false, error: assigneeResult.error };
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

  await logTaskActivity(task.id, authResult.user.id, "created");

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

  await logTaskActivity(updated.id, authResult.user.id, "updated", {
    fields: Object.keys(safeUpdate),
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
  newPosition?: number,
): Promise<ActionResult<Task>> {
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

  // NOTE: same-list moves are no longer a no-op — this is a deliberate
  // behavior change from #17's original version, to support manual
  // within-list reordering (same track as the list-reorder work).
  const destTasksAll = await queries.tasks.getByList(newListId);
  const destTasks = destTasksAll.filter((t) => t.id !== taskId);

  const clampedPosition =
    newPosition !== undefined
      ? Math.max(0, Math.min(newPosition, destTasks.length))
      : destTasks.length; // default: append, same as before

  const reordered = [...destTasks];
  reordered.splice(clampedPosition, 0, existingTask);

  let updatedTask: Task | undefined;
  const updates = reordered.map(async (t, index) => {
    if (t.id === taskId) {
      updatedTask = await queries.tasks.update(taskId, {
        listId: newListId,
        position: index,
      });
    } else if (t.position !== index) {
      await queries.tasks.update(t.id, { position: index });
    }
  });

  await Promise.all(updates);

  if (existingTask.listId !== newListId) {
    await logTaskActivity(taskId, authResult.user.id, "moved", {
      fromListId: existingTask.listId,
      toListId: newListId,
      fromListName: sourceOwnership.list.name,
      toListName: destOwnership.list.name,
    });
  }

  return { success: true, data: updatedTask! };
}

export async function getTasksByProject(
  projectId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.tasks.getByProject>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  // Ownership: getProject/getListsByProject already validate project
  // access on this page load, so this is a secondary read — but if you
  // want defense-in-depth per-project ownership check here, this is
  // where it'd go (similar to assertListOwnership, but project-scoped).

  const tasks = await queries.tasks.getByProject(projectId);
  return { success: true, data: tasks };
}
