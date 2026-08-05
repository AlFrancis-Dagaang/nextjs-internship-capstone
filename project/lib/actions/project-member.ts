"use server";

import { queries } from "@/lib/db";
import {
  addProjectMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertProjectOwnership,
  assertProjectViewAccess,
} from "@/lib/services/ownership";
import type { ProjectMember } from "../db/schema";
import { searchUsersSchema } from "@/lib/validations";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function addProjectMember(
  projectId: string,
  input: unknown,
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

  const ownership = await assertProjectOwnership(projectId, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const targetUser = await queries.users.getByEmail(parsed.data.email);
  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  if (targetUser.id === ownership.project.ownerId) {
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

  const ownership = await assertProjectOwnership(projectId, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const existingMember = await queries.projectMembers.getById(memberId);
  if (!existingMember || existingMember.projectId !== projectId) {
    return { success: false, error: "Not found" };
  }

  const updated = await queries.projectMembers.updateRole(
    memberId,
    parsed.data.role,
  );
  return { success: true, data: updated };
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const ownership = await assertProjectOwnership(projectId, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const existingMember = await queries.projectMembers.getById(memberId);
  if (!existingMember || existingMember.projectId !== projectId) {
    return { success: false, error: "Not found" };
  }

  await queries.projectMembers.remove(memberId);
  return { success: true, data: null };
}

type UserSearchResult = {
  id: string;
  email: string;
  name: string;
  status: "available" | "member" | "owner";
  role?: "editor" | "viewer"; // present when status === "member"
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

  const ownership = await assertProjectOwnership(projectId, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const [existingMembers, results] = await Promise.all([
    queries.projectMembers.getByProject(projectId),
    queries.users.searchByEmailPrefix(parsed.data.query),
  ]);

  const memberRoleById = new Map(
    existingMembers.map((m) => [m.userId, m.role]),
  );

  const annotated: UserSearchResult[] = results.map((u) => {
    if (u.id === ownership.project.ownerId) {
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
