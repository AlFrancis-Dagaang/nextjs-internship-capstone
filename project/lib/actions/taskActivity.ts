"use server"

import { queries } from "@/lib/db"
import { getAuthedUserOrError } from "@/lib/services/auth"
import { assertListViewAccess } from "@/lib/services/ownership"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getTaskActivity(
  taskId: string,
  limit?: number,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.taskActivity.getByTask>>>
> {
  const [authResult, task] = await Promise.all([
    getAuthedUserOrError(),
    queries.tasks.getById(taskId),
  ])

  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" }
  }

  if (!task) {
    return { success: false, error: "Not found" }
  }

  const access = await assertListViewAccess(task.listId, authResult.user.id)
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" }
  }

  const activity = await queries.taskActivity.getByTask(taskId, limit)
  return { success: true, data: activity }
}

export type ActivityPageResult = {
  items: Awaited<ReturnType<typeof queries.taskActivity.getByTaskPaginated>>
  nextCursor: { createdAt: string; id: string } | null
}

export async function getTaskActivityPage(
  taskId: string,
  options: {
    limit?: number
    cursor?: { createdAt: string; id: string }
    actorName?: string
    action?: string
  } = {},
): Promise<ActionResult<ActivityPageResult>> {
  const authResult = await getAuthedUserOrError()
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" }
  }

  const task = await queries.tasks.getById(taskId)
  if (!task) {
    return { success: false, error: "Not found" }
  }

  const access = await assertListViewAccess(task.listId, authResult.user.id)
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" }
  }

  const limit = options.limit ?? 30
  const cursor = options.cursor
    ? { createdAt: new Date(options.cursor.createdAt), id: options.cursor.id }
    : undefined

  const rows = await queries.taskActivity.getByTaskPaginated(taskId, {
    limit,
    cursor,
    actorName: options.actorName,
    action: options.action,
  })

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items[items.length - 1]
  const nextCursor =
    hasMore && last
      ? { createdAt: last.createdAt.toISOString(), id: last.id }
      : null

  return { success: true, data: { items, nextCursor } }
}
