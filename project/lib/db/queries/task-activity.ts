import type { InferInsertModel } from "drizzle-orm"
import { and, desc, eq, ilike, lt, or } from "drizzle-orm"
import { db } from "../client"
import { lists, taskActivity, tasks, users } from "../schema"

export const taskActivityQueries = {
  getByTask: async (taskId: string, limit?: number) => {
    const query = db
      .select({
        id: taskActivity.id,
        taskId: taskActivity.taskId,
        actorId: taskActivity.actorId,
        action: taskActivity.action,
        metadata: taskActivity.metadata,
        createdAt: taskActivity.createdAt,
        actor: {
          id: users.id,
          name: users.name,
          imageUrl: users.imageUrl, // <--- Add this
          hasImage: users.hasImage, // <--- Add this
        },
      })
      .from(taskActivity)
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(eq(taskActivity.taskId, taskId))
      .orderBy(desc(taskActivity.createdAt))

    if (limit) {
      return query.limit(limit)
    }

    return query
  },
  create: async (data: InferInsertModel<typeof taskActivity>) => {
    const [entry] = await db.insert(taskActivity).values(data).returning()
    return entry
  },
  getByProjectAndActor: async (
    projectId: string,
    actorId: string,
    limit = 5,
  ) => {
    return db
      .select({
        id: taskActivity.id,
        taskId: taskActivity.taskId,
        actorId: taskActivity.actorId,
        action: taskActivity.action,
        metadata: taskActivity.metadata,
        createdAt: taskActivity.createdAt,
        taskTitle: tasks.title,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(eq(lists.projectId, projectId), eq(taskActivity.actorId, actorId)),
      )
      .orderBy(desc(taskActivity.createdAt))
      .limit(limit)
  },
  getByTaskPaginated: async (
    taskId: string,
    options: {
      limit: number
      cursor?: { createdAt: Date; id: string }
      actorName?: string
      action?: string
    },
  ) => {
    const conditions = [eq(taskActivity.taskId, taskId)]

    if (options.actorName) {
      conditions.push(ilike(users.name, `%${options.actorName}%`))
    }
    if (options.action) {
      conditions.push(eq(taskActivity.action, options.action as any))
    }
    if (options.cursor) {
      conditions.push(
        or(
          lt(taskActivity.createdAt, options.cursor.createdAt),
          and(
            eq(taskActivity.createdAt, options.cursor.createdAt),
            lt(taskActivity.id, options.cursor.id),
          ),
        )!,
      )
    }

    return db
      .select({
        id: taskActivity.id,
        taskId: taskActivity.taskId,
        actorId: taskActivity.actorId,
        action: taskActivity.action,
        metadata: taskActivity.metadata,
        createdAt: taskActivity.createdAt,
        actor: {
          id: users.id,
          name: users.name,
          imageUrl: users.imageUrl,
          hasImage: users.hasImage,
        },
      })
      .from(taskActivity)
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(taskActivity.createdAt), desc(taskActivity.id))
      .limit(options.limit + 1)
  },
}
