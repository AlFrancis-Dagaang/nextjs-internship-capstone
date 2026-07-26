import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { projects } from "../schema";

export const projectsQueries = {
  getAll: async () => {
    return db.select().from(projects);
  },
  getById: async (id: string) => {
    return db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: { lists: { with: { tasks: true } } },
    });
  },
  getByOwner: async (ownerId: string) => {
    return db.select().from(projects).where(eq(projects.ownerId, ownerId));
  },
  create: async (data: InferInsertModel<typeof projects>) => {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  },
  update: async (
    id: string,
    data: Partial<InferInsertModel<typeof projects>>,
  ) => {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  },
  delete: async (id: string) => {
    await db.delete(projects).where(eq(projects.id, id));
  },
};
