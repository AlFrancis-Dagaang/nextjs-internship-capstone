import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { taskActivity } from "../schema";
import type { InferInsertModel } from "drizzle-orm";

export const taskActivityQueries = {
  getByTask: async (taskId: string) => {
    return db
      .select()
      .from(taskActivity)
      .where(eq(taskActivity.taskId, taskId))
      .orderBy(desc(taskActivity.createdAt));
  },
  create: async (data: InferInsertModel<typeof taskActivity>) => {
    const [entry] = await db.insert(taskActivity).values(data).returning();
    return entry;
  },
};
