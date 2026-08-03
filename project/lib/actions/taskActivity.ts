"use server";

import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertListViewAccess } from "@/lib/services/ownership";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getTaskActivity(
  taskId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.taskActivity.getByTask>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const task = await queries.tasks.getById(taskId);
  if (!task) {
    return { success: false, error: "Not found" };
  }

  const access = await assertListViewAccess(task.listId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const activity = await queries.taskActivity.getByTask(taskId);
  return { success: true, data: activity };
}
