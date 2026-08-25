import type { InferInsertModel } from "drizzle-orm"
import { and, desc, eq } from "drizzle-orm"
import { db } from "../client"
import { notifications, tasks } from "../schema"

export const notificationsQueries = {
  getByUser: async (userId: string, limit = 30) => {
    return db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
      limit,
    })
  },
  getUnreadCount: async (userId: string) => {
    const rows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
    return rows.length
  },
  getById: async (id: string) => {
    return db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    })
  },
  create: async (data: InferInsertModel<typeof notifications>) => {
    const [row] = await db.insert(notifications).values(data).returning()
    return row
  },
  markRead: async (id: string) => {
    const [row] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning()
    return row
  },
  markAllReadForUser: async (userId: string) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
  },
  existsForUserTaskType: async (
    userId: string,
    taskId: string,
    type: string,
  ) => {
    const row = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.taskId, taskId),
        eq(
          notifications.type,
          type as (typeof notifications.type.enumValues)[number],
        ),
      ),
    })
    return !!row
  },
  // For the cron route — non-archived tasks with a dueDate in range.
  getDueBetween: async (start: Date, end: Date) => {
    const { and: andOp, eq: eqOp, gte, lte } = await import("drizzle-orm")
    return db
      .select()
      .from(tasks)
      .where(
        andOp(
          eqOp(tasks.isArchived, false),
          gte(tasks.dueDate, start),
          lte(tasks.dueDate, end),
        ),
      )
  },
}
