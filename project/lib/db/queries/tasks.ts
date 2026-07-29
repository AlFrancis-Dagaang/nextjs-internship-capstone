import { asc, eq, sql, inArray } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { lists, tasks, comments } from "../schema";

export const tasksQueries = {
  getByProject: async (projectId: string) => {
    const listsWithTasks = await db.query.lists.findMany({
      where: eq(lists.projectId, projectId),
      with: { tasks: true },
    });

    const allTasks = listsWithTasks.flatMap((list) => list.tasks);
    const taskIds = allTasks.map((t) => t.id);

    if (taskIds.length === 0) {
      return allTasks;
    }

    const commentCounts = await db
      .select({
        taskId: comments.taskId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(inArray(comments.taskId, taskIds))
      .groupBy(comments.taskId);

    const countMap = new Map(commentCounts.map((c) => [c.taskId, c.count]));

    return allTasks.map((task) => ({
      ...task,
      commentCount: countMap.get(task.id) ?? 0,
    }));
  },
  getByList: async (listId: string) => {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.listId, listId))
      .orderBy(asc(tasks.position));
  },
  getById: async (id: string) => {
    return db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  },
  create: async (data: InferInsertModel<typeof tasks>) => {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  },
  update: async (id: string, data: Partial<InferInsertModel<typeof tasks>>) => {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  },
  delete: async (id: string) => {
    await db.delete(tasks).where(eq(tasks.id, id));
  },
};
