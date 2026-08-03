import { eq, or } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { projects, projectMembers } from "../schema";

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
  /**
   * Dashboard visibility fix (#29): owned projects + projects where the
   * user has a project_members row. leftJoin so owners with no
   * membership row still match; the unique (projectId, userId)
   * constraint on project_members means at most one membership row per
   * user per project, so no duplicate rows to dedupe.
   */
  getByOwnerOrMember: async (userId: string) => {
    return db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        ownerId: projects.ownerId,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(
        or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId)),
      );
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
