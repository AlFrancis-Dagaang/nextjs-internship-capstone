import { asc, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { comments } from "../schema";

export const commentsQueries = {
  getByTask: async (taskId: string) => {
    return db.query.comments.findMany({
      where: eq(comments.taskId, taskId),
      orderBy: asc(comments.createdAt),
      with: { author: true },
    });
  },
  getById: async (id: string) => {
    return db.query.comments.findFirst({ where: eq(comments.id, id) });
  },
  create: async (data: InferInsertModel<typeof comments>) => {
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  },
  delete: async (id: string) => {
    await db.delete(comments).where(eq(comments.id, id));
  },
};
