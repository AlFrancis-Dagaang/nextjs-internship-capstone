"use server";

import { revalidatePath } from "next/cache";
import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertProjectAccess,
  assertTeamOwnership,
} from "@/lib/services/ownership";
import {
  teamCreateSchema,
  teamUpdateSchema,
  addTeamMemberSchema,
  searchUsersSchema,
} from "@/lib/validations";
import type { Team, TeamMember } from "@/lib/db/schema";
import { createNotification } from "@/lib/services/notifications";
import { logTaskActivity } from "../services/activity";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createTeam(input: unknown): Promise<ActionResult<Team>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = teamCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const team = await queries.teams.create({
    name: parsed.data.name,
    createdBy: authResult.user.id,
  });

  revalidatePath("/team");

  return { success: true, data: team };
}

export async function updateTeam(
  teamId: string,
  input: unknown,
): Promise<ActionResult<Team>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = teamUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await assertTeamOwnership(teamId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const team = await queries.teams.update(teamId, parsed.data);

  revalidatePath("/team");

  return { success: true, data: team };
}

export async function deleteTeam(teamId: string): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertTeamOwnership(teamId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  // Snapshot members and attached projects BEFORE deleting — needed
  // regardless of whether the FK cascade wipes project_teams/team_members
  // rows automatically, since we need the pre-delete state to know who
  // to re-check afterward (#83, same shape as removeTeamMember).
  const [teamMembers, attachedProjects] = await Promise.all([
    queries.teams.getMembers(teamId),
    queries.projectTeams.getByTeam(teamId),
  ]);

  await queries.teams.remove(teamId);

  // Cross product: for every (member, project) pair that existed via
  // this team, re-check whether the member still has access to that
  // project through some other path (direct row, or a different team).
  // Only unassign where access is fully gone.
  await Promise.all(
    teamMembers.flatMap((member) =>
      attachedProjects.map(async ({ projectId }) => {
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
                  reason: "team_deleted",
                },
              );
            }),
          );
        }
      }),
    ),
  );

  revalidatePath("/team");

  return { success: true, data: null };
}

export async function addTeamMember(
  teamId: string,
  input: unknown,
): Promise<ActionResult<TeamMember>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = addTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await assertTeamOwnership(teamId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const targetUser = await queries.users.getByEmail(parsed.data.email);
  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  const existingMembers = await queries.teams.getMembers(teamId);
  if (existingMembers.some((m) => m.userId === targetUser.id)) {
    return { success: false, error: "This user is already a member" };
  }

  const member = await queries.teams.addMember(teamId, targetUser.id);

  const actor = await queries.users.getById(authResult.user.id);
  await createNotification({
    userId: targetUser.id,
    type: "team_member_added",
    message: `${actor?.name ?? "Someone"} added you to the team "${access.team.name}"`,
    actorId: authResult.user.id,
  });

  revalidatePath("/team");

  return { success: true, data: member };
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertTeamOwnership(teamId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  await queries.teams.removeMember(teamId, userId);

  const actor = await queries.users.getById(authResult.user.id);
  await createNotification({
    userId,
    type: "team_member_removed",
    message: `${actor?.name ?? "Someone"} removed you from the team "${access.team.name}"`,
    actorId: authResult.user.id,
  });

  revalidatePath("/team");

  return { success: true, data: null };
}
// lib/actions/team.ts
export async function getTeamMembers(teamId: string) {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }
  try {
    const members = await queries.teams.getMembers(teamId);
    return { success: true, data: members };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch members",
    };
  }
}

export async function searchUsersForTeamInvite(
  teamId: string,
  query: string,
): Promise<
  ActionResult<
    {
      id: string;
      email: string;
      name: string;
      status: "available" | "member" | "creator";
    }[]
  >
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = searchUsersSchema.safeParse({ query });
  if (!parsed.success) {
    return { success: true, data: [] };
  }

  const access = await assertTeamOwnership(teamId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const [existingMembers, results] = await Promise.all([
    queries.teams.getMembers(teamId),
    queries.users.searchByNameOrEmailPrefix(parsed.data.query),
  ]);

  const memberIds = new Set(existingMembers.map((m) => m.userId));

  const annotated = results.map((u) => {
    if (u.id === access.team.createdBy) {
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        status: "creator" as const,
      };
    }
    if (memberIds.has(u.id)) {
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        status: "member" as const,
      };
    }
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      status: "available" as const,
    };
  });

  return { success: true, data: annotated };
}
