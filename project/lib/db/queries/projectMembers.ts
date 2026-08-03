import { and, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { projectMembers, users } from "../schema";

export const projectMembersQueries = {
  getByProjectAndUser: async (projectId: string, userId: string) => {
    return db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    });
  },
  getByProject: async (projectId: string) => {
    return db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
  },
  create: async (data: InferInsertModel<typeof projectMembers>) => {
    const [member] = await db.insert(projectMembers).values(data).returning();
    return member;
  },
  updateRole: async (id: string, role: "editor" | "viewer") => {
    const [member] = await db
      .update(projectMembers)
      .set({ role })
      .where(eq(projectMembers.id, id))
      .returning();
    return member;
  },
  remove: async (id: string) => {
    await db.delete(projectMembers).where(eq(projectMembers.id, id));
  },
};
