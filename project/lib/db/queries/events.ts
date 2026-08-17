import { eq, or, and, exists, isNull, asc } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { events, projects, projectMembers } from "../schema";

export const eventsQueries = {
  getById: async (id: string) => {
    return db.query.events.findFirst({ where: eq(events.id, id) });
  },
  // Personal events the user created, plus events tied to a project
  // they own or are a member of — mirrors getByOwnerOrMember exactly
  // (owner branch + project_members exists-check).
  getForUser: async (userId: string) => {
    return db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        startAt: events.startAt,
        endAt: events.endAt,
        creatorId: events.creatorId,
        projectId: events.projectId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .leftJoin(projects, eq(events.projectId, projects.id))
      .where(
        or(
          and(eq(events.creatorId, userId), isNull(events.projectId)),
          eq(projects.ownerId, userId),
          exists(
            db
              .select({ id: projectMembers.id })
              .from(projectMembers)
              .where(
                and(
                  eq(projectMembers.projectId, events.projectId),
                  eq(projectMembers.userId, userId),
                ),
              ),
          ),
        ),
      );
  },
  create: async (data: InferInsertModel<typeof events>) => {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  },
  update: async (
    id: string,
    data: Partial<InferInsertModel<typeof events>>,
  ) => {
    const [event] = await db
      .update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  },
  delete: async (id: string) => {
    await db.delete(events).where(eq(events.id, id));
  },
  // Added #80 — events scoped to one project, for the project-detail
  // modal's events section. Ordered soonest-first.
  getByProject: async (projectId: string) => {
    return db.query.events.findMany({
      where: eq(events.projectId, projectId),
      orderBy: asc(events.startAt),
    });
  },
};
