import type { InferInsertModel } from "drizzle-orm"
import { asc, eq } from "drizzle-orm"
import { db } from "../client"
import { comments, users } from "../schema"

export const commentsQueries = {
  // Update your getByTask query in commentsQueries or your actions:
  getByTask: async (taskId: string) => {
    const rows = await db
      .select({
        id: comments.id,
        taskId: comments.taskId,
        authorId: comments.authorId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          imageUrl: users.imageUrl, // Explicitly selected
          hasImage: users.hasImage, // Explicitly selected
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(asc(comments.createdAt))

    return rows
  },
  getById: async (id: string) => {
    return db.query.comments.findFirst({ where: eq(comments.id, id) })
  },
  create: async (data: InferInsertModel<typeof comments>) => {
    const [comment] = await db.insert(comments).values(data).returning()
    return comment
  },
  update: async (
    id: string,
    data: Partial<InferInsertModel<typeof comments>>,
  ) => {
    const [comment] = await db
      .update(comments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning()
    return comment
  },
  delete: async (id: string) => {
    await db.delete(comments).where(eq(comments.id, id))
  },
}
