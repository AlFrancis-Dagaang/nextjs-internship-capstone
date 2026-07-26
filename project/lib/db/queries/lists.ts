import { asc, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { lists } from "../schema";

export const listsQueries = {
  getByProject: async (projectId: string) => {
    return db
      .select()
      .from(lists)
      .where(eq(lists.projectId, projectId))
      .orderBy(asc(lists.position));
  },
  getById: async (id: string) => {
    return db.query.lists.findFirst({ where: eq(lists.id, id) });
  },
  create: async (data: InferInsertModel<typeof lists>) => {
    const [list] = await db.insert(lists).values(data).returning();
    return list;
  },
  update: async (id: string, data: Partial<InferInsertModel<typeof lists>>) => {
    const [list] = await db
      .update(lists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lists.id, id))
      .returning();
    return list;
  },
  delete: async (id: string) => {
    await db.delete(lists).where(eq(lists.id, id));
  },
};
