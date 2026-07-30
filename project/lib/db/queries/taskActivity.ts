import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { taskActivity, users } from "../schema";
import type { InferInsertModel } from "drizzle-orm";

export const taskActivityQueries = {
  getByTask: async (taskId: string) => {
    const rows = await db
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
        },
      })
      .from(taskActivity)
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(eq(taskActivity.taskId, taskId))
      .orderBy(desc(taskActivity.createdAt));

    return rows;
  },
  create: async (data: InferInsertModel<typeof taskActivity>) => {
    const [entry] = await db.insert(taskActivity).values(data).returning();
    return entry;
  },
};
