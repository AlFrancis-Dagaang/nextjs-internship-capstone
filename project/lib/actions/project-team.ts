"use server";

import { revalidatePath } from "next/cache";
import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertProjectManageAccess } from "@/lib/services/ownership";
import {
  attachTeamToProjectSchema,
  updateProjectTeamRoleSchema,
} from "@/lib/validations";
import type { ProjectTeam } from "@/lib/db/schema";
import { createNotification } from "@/lib/services/notifications";

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

  await queries.projectTeams.remove(projectTeamId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/team`);

  return { success: true, data: null };
}
