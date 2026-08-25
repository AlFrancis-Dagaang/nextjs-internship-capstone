import type { InferInsertModel } from "drizzle-orm"
import { and, eq, ilike, or } from "drizzle-orm"
import { db } from "../client"
import { teamMembers, teams, users } from "../schema"

export const teamsQueries = {
  getById: async (id: string) => {
    return db.query.teams.findFirst({ where: eq(teams.id, id) })
  },
  getAll: async () => {
    return db.query.teams.findMany()
  },
  create: async (data: InferInsertModel<typeof teams>) => {
    const [team] = await db.insert(teams).values(data).returning()
    return team
  },
  update: async (id: string, data: Partial<InferInsertModel<typeof teams>>) => {
    const [team] = await db
      .update(teams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning()
    return team
  },
  remove: async (id: string) => {
    await db.delete(teams).where(eq(teams.id, id))
  },

  getByCreator: async (userId: string) => {
    return db.query.teams.findMany({ where: eq(teams.createdBy, userId) })
  },
  getForUser: async (userId: string) => {
    return db
      .select({
        id: teams.id,
        name: teams.name,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
      .where(or(eq(teams.createdBy, userId), eq(teamMembers.userId, userId)))
      .groupBy(teams.id) // Prevents duplicate rows if you are both creator and member
  },

  // team_members — folded in here rather than a separate query file,
  // since team membership has no meaning independent of a team (mirrors
  // how project-members.ts owns its own join-table shape).
  getMembers: async (teamId: string) => {
    return db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        createdAt: teamMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImageUrl: users.imageUrl,
        userHasImage: users.hasImage,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
  },

  /**
   * All team IDs a user belongs to, across every team — the starting
   * point for effective-role resolution in ownership.ts when there's no
   * direct project_members row (#76).
   */
  getTeamIdsForUser: async (userId: string) => {
    const rows = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId))
    return rows.map((r) => r.teamId)
  },

  addMember: async (teamId: string, userId: string) => {
    const [member] = await db
      .insert(teamMembers)
      .values({ teamId, userId })
      .returning()
    return member
  },
  removeMember: async (teamId: string, userId: string) => {
    await db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      )
  },
  searchByName: async (query: string) => {
    return db
      .select({
        id: teams.id,
        name: teams.name,
        createdBy: teams.createdBy,
      })
      .from(teams)
      .where(ilike(teams.name, `%${query}%`))
      .limit(10)
  },
}
