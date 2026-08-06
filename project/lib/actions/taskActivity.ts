"use server";

import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertListViewAccess } from "@/lib/services/ownership";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getTaskActivity(
  taskId: string,
  limit?: number,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.taskActivity.getByTask>>>
> {
  const [authResult, task] = await Promise.all([
    getAuthedUserOrError(),
    queries.tasks.getById(taskId),
  ]);

  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  if (!task) {
    return { success: false, error: "Not found" };
  }

  const access = await assertListViewAccess(task.listId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const activity = await queries.taskActivity.getByTask(taskId, limit);
  return { success: true, data: activity };
}
