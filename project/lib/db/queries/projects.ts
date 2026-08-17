import { eq, or, exists, and, isNotNull } from "drizzle-orm";
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
      .where(
        or(
          eq(projects.ownerId, userId),
          exists(
            db
              .select({ id: projectMembers.id })
              .from(projectMembers)
              .where(
                and(
                  eq(projectMembers.projectId, projects.id),
                  eq(projectMembers.userId, userId),
                ),
              ),
          ),
        ),
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
  // Added #79 — projects the user can attach an event to: owned, or
  // member with an "editor" role. Deliberately excludes viewer-role
  // memberships, since assertProjectEditAccess (the actual server-side
  // gate on createEvent/updateEvent) rejects viewers — this list exists
  // so the picker doesn't even show projects the user can't use, not as
  // the real permission boundary.
  getEditableByUser: async (userId: string) => {
    return db
      .select({
        id: projects.id,
        name: projects.name,
      })
      .from(projects)
      .where(
        or(
          eq(projects.ownerId, userId),
          exists(
            db
              .select({ id: projectMembers.id })
              .from(projectMembers)
              .where(
                and(
                  eq(projectMembers.projectId, projects.id),
                  eq(projectMembers.userId, userId),
                  eq(projectMembers.role, "editor"),
                ),
              ),
          ),
        ),
      );
  },
  getWithDueDatesForUser: async (userId: string) => {
    return db
      .select({
        id: projects.id,
        name: projects.name,
        dueDate: projects.dueDate,
      })
      .from(projects)
      .where(
        and(
          isNotNull(projects.dueDate),
          or(
            eq(projects.ownerId, userId),
            exists(
              db
                .select({ id: projectMembers.id })
                .from(projectMembers)
                .where(
                  and(
                    eq(projectMembers.projectId, projects.id),
                    eq(projectMembers.userId, userId),
                  ),
                ),
            ),
          ),
        ),
      );
  },
};
