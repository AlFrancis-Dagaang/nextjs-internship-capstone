import { and, eq, inArray } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { projectTeams, teams } from "../schema";

export const projectTeamsQueries = {
  getByProjectAndTeam: async (projectId: string, teamId: string) => {
    return db.query.projectTeams.findFirst({
      where: and(
        eq(projectTeams.projectId, projectId),
        eq(projectTeams.teamId, teamId),
      ),
    });
  },
  getByProject: async (projectId: string) => {
    return db
      .select({
        id: projectTeams.id,
        projectId: projectTeams.projectId,
        teamId: projectTeams.teamId,
        role: projectTeams.role,
        createdAt: projectTeams.createdAt,
        teamName: teams.name,
      })
      .from(projectTeams)
      .innerJoin(teams, eq(projectTeams.teamId, teams.id))
      .where(eq(projectTeams.projectId, projectId));
  },

  /**
   * The team-derived roles a user is entitled to on a project, one row
   * per matching team. Callers (ownership.ts) reduce this to a single
   * highest-ranked role — this query intentionally does not pick a
   * winner itself, so the ranking logic lives in one place.
   */
  getRolesForProjectAndTeams: async (projectId: string, teamIds: string[]) => {
    if (teamIds.length === 0) return [];
    return db
      .select({ role: projectTeams.role })
      .from(projectTeams)
      .where(
        and(
          eq(projectTeams.projectId, projectId),
          inArray(projectTeams.teamId, teamIds),
        ),
      );
  },

  create: async (data: InferInsertModel<typeof projectTeams>) => {
    const [pt] = await db.insert(projectTeams).values(data).returning();
    return pt;
  },
  updateRole: async (id: string, role: "editor" | "contributor" | "viewer") => {
    const [pt] = await db
      .update(projectTeams)
      .set({ role })
      .where(eq(projectTeams.id, id))
      .returning();
    return pt;
  },
  remove: async (id: string) => {
    await db.delete(projectTeams).where(eq(projectTeams.id, id));
  },
};
