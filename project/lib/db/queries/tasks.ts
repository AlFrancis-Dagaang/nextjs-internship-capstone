import { asc, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { lists, tasks } from "../schema";

export const tasksQueries = {
  getByProject: async (projectId: string) => {
    const listsWithTasks = await db.query.lists.findMany({
      where: eq(lists.projectId, projectId),
      with: { tasks: true },
    });
    return listsWithTasks.flatMap((list) => list.tasks);
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
