import type { InferInsertModel } from "drizzle-orm"
import { and, eq } from "drizzle-orm"
import type { ProjectMemberRole } from "@/types"
import { db } from "../client"
import { projectMembers, users } from "../schema"

export const projectMembersQueries = {
  getByProjectAndUser: async (projectId: string, userId: string) => {
    return db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    })
  },
  getById: async (id: string) => {
    return db.query.projectMembers.findFirst({
      where: eq(projectMembers.id, id),
    })
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
        userImageUrl: users.imageUrl,
        userHasImage: users.hasImage,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
  },
  create: async (data: InferInsertModel<typeof projectMembers>) => {
    const [member] = await db.insert(projectMembers).values(data).returning()
    return member
  },
  updateRole: async (id: string, role: ProjectMemberRole) => {
    const [member] = await db
      .update(projectMembers)
      .set({ role })
      .where(eq(projectMembers.id, id))
      .returning()
    return member
  },
  remove: async (id: string) => {
    await db.delete(projectMembers).where(eq(projectMembers.id, id))
  },
}
