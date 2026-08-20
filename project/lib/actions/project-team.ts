"use server";

import { revalidatePath } from "next/cache";
import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertProjectAccess,
  assertProjectManageAccess,
} from "@/lib/services/ownership";
import {
  attachTeamToProjectSchema,
  updateProjectTeamRoleSchema,
} from "@/lib/validations";
import type { ProjectTeam } from "@/lib/db/schema";
import { createNotification } from "@/lib/services/notifications";
import { logTaskActivity } from "../services/activity";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function attachTeamToProject(
  projectId: string,
  input: unknown,
): Promise<ActionResult<ProjectTeam>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = attachTeamToProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await assertProjectManageAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const team = await queries.teams.getById(parsed.data.teamId);
  if (!team) {
    return { success: false, error: "Team not found" };
  }

  const existing = await queries.projectTeams.getByProjectAndTeam(
    projectId,
    parsed.data.teamId,
  );
  if (existing) {
    return {
      success: false,
      error: "This team already has access to the project",
    };
  }

  const projectTeam = await queries.projectTeams.create({
    projectId,
    teamId: parsed.data.teamId,
    role: parsed.data.role,
  });

  const teamMembers = await queries.teams.getMembers(parsed.data.teamId);
  await Promise.all(
    teamMembers.map((m) =>
      createNotification({
        userId: m.userId,
        type: "team_attached_to_project",
        message: `Your team "${team.name}" was given ${parsed.data.role} access to "${access.project.name}"`,
        projectId,
        actorId: authResult.user.id,
      }),
    ),
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/team`);

  return { success: true, data: projectTeam };
}

export async function updateProjectTeamRole(
  projectId: string,
  projectTeamId: string,
  input: unknown,
): Promise<ActionResult<ProjectTeam>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = updateProjectTeamRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await assertProjectManageAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const existing = await queries.projectTeams.getByProject(projectId);
  const target = existing.find((pt) => pt.id === projectTeamId);
  if (!target) {
    return { success: false, error: "Not found" };
  }

  const updated = await queries.projectTeams.updateRole(
    projectTeamId,
    parsed.data.role,
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/team`);

  return { success: true, data: updated };
}

export async function detachTeamFromProject(
  projectId: string,
  projectTeamId: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectManageAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const existing = await queries.projectTeams.getByProject(projectId);
  const target = existing.find((pt) => pt.id === projectTeamId);
  if (!target) {
    return { success: false, error: "Not found" };
  }

  // Snapshot the team's members BEFORE detaching, so we know who to
  // re-check afterward.
  const teamMembers = await queries.teams.getMembers(target.teamId);

  await queries.projectTeams.remove(projectTeamId);

  // For each former team member, re-resolve their access now that this
  // team's grant is gone. If they still have access (a direct
  // project_members row, or another attached team), leave their task
  // assignments alone. Only unassign users who lost access entirely —
  // same cleanup removeProjectMember does, but conditional here since
  // detaching a team doesn't necessarily mean losing access (#83).
  await Promise.all(
    teamMembers.map(async (member) => {
      const stillHasAccess = await assertProjectAccess(
        projectId,
        member.userId,
      );
      if ("error" in stillHasAccess) {
        const affectedAssignments =
          await queries.taskAssignees.getByProjectAndUser(
            projectId,
            member.userId,
          );
        await Promise.all(
          affectedAssignments.map(async (assignment) => {
            await queries.taskAssignees.remove(
              assignment.taskId,
              member.userId,
            );
            await logTaskActivity(
              assignment.taskId,
              authResult.user.id,
              "assignee_changed",
              {
                type: "unassigned",
                assigneeId: member.userId,
                assigneeName: assignment.userName ?? "Unknown user",
                reason: "team_detached_from_project",
              },
            );
          }),
        );
      }
    }),
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/team`);

  return { success: true, data: null };
}

export async function searchTeamsForProjectAttach(
  projectId: string,
  query: string,
): Promise<
  ActionResult<{ id: string; name: string; status: "available" | "attached" }[]>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectManageAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const [matches, attached] = await Promise.all([
    queries.teams.searchByName(query),
    queries.projectTeams.getByProject(projectId),
  ]);

  const attachedTeamIds = new Set(attached.map((pt) => pt.teamId));

  const results = matches.map((t) => ({
    id: t.id,
    name: t.name,
    status: (attachedTeamIds.has(t.id) ? "attached" : "available") as
      | "available"
      | "attached",
  }));

  return { success: true, data: results };
}
