"use server";

import { queries } from "@/lib/db";
import {
  addProjectMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertProjectOwnership,
  assertProjectManageAccess,
  assertProjectViewAccess,
} from "@/lib/services/ownership";
import type { ProjectMember } from "../db/schema";
import { searchUsersSchema } from "@/lib/validations";
import { logTaskActivity } from "@/lib/services/activity";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/services/notifications";
import { publishProjectEvent } from "@/lib/realtime/server";
import { getEffectiveProjectMembers as getEffectiveProjectMembersService } from "@/lib/services/team";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function addProjectMember(
  projectId: string,
  input: unknown,
  originClientId?: string,
): Promise<ActionResult<ProjectMember>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = addProjectMemberSchema.safeParse(input);
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

  const targetUser = await queries.users.getByEmail(parsed.data.email);
  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  if (targetUser.id === access.project.ownerId) {
    return { success: false, error: "This user already owns the project" };
  }

  const existingMembership = await queries.projectMembers.getByProjectAndUser(
    projectId,
    targetUser.id,
  );
  if (existingMembership) {
    return { success: false, error: "This user is already a member" };
  }

  const member = await queries.projectMembers.create({
    projectId,
    userId: targetUser.id,
    role: parsed.data.role ?? "viewer",
  });

  const actor = await queries.users.getById(authResult.user.id);
  await createNotification({
    userId: targetUser.id,
    type: "project_added",
    message: `${actor?.name ?? "Someone"} added you to "${access.project.name}"`,
    projectId,
    actorId: authResult.user.id,
  });

  await publishProjectEvent(
    projectId,
    {
      type: "member_added",
      member: {
        memberId: member.id,
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: member.role,
      },
    },
    originClientId,
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return { success: true, data: member };
}

export async function getProjectMembers(
  projectId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.projectMembers.getByProject>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  // Changed from assertProjectOwnership: viewing the member list is part
  // of viewing the project (matrix: view = all roles ✅). Only
  // add/remove/updateRole stay owner-only.
  const access = await assertProjectViewAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const members = await queries.projectMembers.getByProject(projectId);
  return { success: true, data: members };
}

export async function getEffectiveProjectMembers(
  projectId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof getEffectiveProjectMembersService>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectViewAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const members = await getEffectiveProjectMembersService(projectId);
  return { success: true, data: members };
}

export async function updateMemberRole(
  projectId: string,
  memberId: string,
  input: unknown,
): Promise<ActionResult<ProjectMember>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = updateMemberRoleSchema.safeParse(input);
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

  const existingMember = await queries.projectMembers.getById(memberId);
  if (!existingMember || existingMember.projectId !== projectId) {
    return { success: false, error: "Not found" };
  }

  const updated = await queries.projectMembers.updateRole(
    memberId,
    parsed.data.role,
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true, data: updated };
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
  originClientId?: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectManageAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const existingMember = await queries.projectMembers.getById(memberId);
  if (!existingMember || existingMember.projectId !== projectId) {
    return { success: false, error: "Not found" };
  }

  // Clear the removed member's task assignments before removing membership
  // itself, so no orphaned task_assignees rows reference a user who no
  // longer has any access to this project (#65's follow-up gap).
  const affectedAssignments = await queries.taskAssignees.getByProjectAndUser(
    projectId,
    existingMember.userId,
  );

  await Promise.all(
    affectedAssignments.map(async (assignment) => {
      await queries.taskAssignees.remove(
        assignment.taskId,
        existingMember.userId,
      );
      await logTaskActivity(
        assignment.taskId,
        authResult.user.id,
        "assignee_changed",
        {
          type: "unassigned",
          assigneeId: existingMember.userId,
          assigneeName: assignment.userName ?? "Unknown user",
          reason: "removed_from_project",
        },
      );
    }),
  );

  await queries.projectMembers.remove(memberId);

  const actor = await queries.users.getById(authResult.user.id);
  await createNotification({
    userId: existingMember.userId,
    type: "project_removed",
    message: `${actor?.name ?? "Someone"} removed you from "${access.project.name}"`,
    projectId,
    actorId: authResult.user.id,
  });

  await publishProjectEvent(
    projectId,
    { type: "member_removed", memberId, userId: existingMember.userId },
    originClientId,
  );
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true, data: null };
}

type UserSearchResult = {
  id: string;
  email: string;
  name: string;
  status: "available" | "member" | "owner";
  role?: "admin" | "editor" | "contributor" | "viewer";
};

export async function searchUsersForInvite(
  projectId: string,
  query: string,
): Promise<ActionResult<UserSearchResult[]>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = searchUsersSchema.safeParse({ query });
  if (!parsed.success) {
    return { success: true, data: [] };
  }

  const access = await assertProjectManageAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const [existingMembers, results] = await Promise.all([
    queries.projectMembers.getByProject(projectId),
    queries.users.searchByNameOrEmailPrefix(parsed.data.query),
  ]);

  const memberRoleById = new Map(
    existingMembers.map((m) => [m.userId, m.role]),
  );

  const annotated: UserSearchResult[] = results.map((u) => {
    if (u.id === access.project.ownerId) {
      return { ...u, status: "owner" };
    }
    const role = memberRoleById.get(u.id);
    if (role) {
      return { ...u, status: "member", role };
    }
    return { ...u, status: "available" };
  });

  return { success: true, data: annotated };
}

export async function getAssignableUsers(
  projectId: string,
): Promise<ActionResult<{ id: string; name?: string; email?: string }[]>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertProjectViewAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const [owner, members, projectTeams] = await Promise.all([
    queries.users.getById(access.project.ownerId),
    queries.projectMembers.getByProject(projectId),
    queries.projectTeams.getByProject(projectId),
  ]);

  const teamMemberLists = await Promise.all(
    projectTeams.map((pt) => queries.teams.getMembers(pt.teamId)),
  );

  const assignableMap = new Map<
    string,
    { id: string; name?: string; email?: string }
  >();

  if (owner) {
    assignableMap.set(owner.id, {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    });
  }
  for (const m of members) {
    assignableMap.set(m.userId, {
      id: m.userId,
      name: m.userName,
      email: m.userEmail,
    });
  }
  for (const teamMembers of teamMemberLists) {
    for (const m of teamMembers) {
      if (!assignableMap.has(m.userId)) {
        assignableMap.set(m.userId, {
          id: m.userId,
          name: m.userName,
          email: m.userEmail,
        });
      }
    }
  }

  return { success: true, data: Array.from(assignableMap.values()) };
}
