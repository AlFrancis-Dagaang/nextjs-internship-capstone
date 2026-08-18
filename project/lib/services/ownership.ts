import { queries } from "@/lib/db";
import type { ProjectMember, ProjectTeamRole } from "../db/schema";
import { cache } from "react";

type ProjectWithLists = NonNullable<
  Awaited<ReturnType<typeof queries.projects.getById>>
>;

type ProjectAccessResult =
  | { error: string }
  | {
      project: ProjectWithLists;
      role: "owner";
      isOwner: true;
      membership: null;
    }
  | {
      project: ProjectWithLists;
      role: "admin" | "editor" | "contributor" | "viewer";
      isOwner: false;
      // A direct project_members row (Some(row)) when the role came from
      // an explicit membership; null when it was resolved from a team
      // instead (#76) — there's no project_members row to point to.
      membership: ProjectMember | null;
    };

const TEAM_ROLE_RANK: Record<ProjectTeamRole, number> = {
  editor: 3,
  contributor: 2,
  viewer: 1,
};

/**
 * Reduces a set of team-derived roles down to the single highest-ranked
 * one. Team roles are schema-capped at editor/contributor/viewer, so
 * this never needs to consider admin/owner.
 */
function highestTeamRole(roles: ProjectTeamRole[]): ProjectTeamRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((highest, role) =>
    TEAM_ROLE_RANK[role] > TEAM_ROLE_RANK[highest] ? role : highest,
  );
}

/**
 * Projects are directly owned — one check against ownerId.
 */
export async function assertProjectOwnership(
  projectId: string,
  userId: string,
) {
  const project = await queries.projects.getById(projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;
  return { project } as const;
}

/**
 * Lists have no ownerId of their own — ownership is indirect, via the
 * parent project. Every list-scoped action must resolve up to
 * project.ownerId.
 */
export async function assertListOwnership(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const project = await queries.projects.getById(list.projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;

  return { list, project } as const;
}

/**
 * Comments have no ownerId of their own. Access to a task's comments
 * requires the same project-ownership check as the task itself — this
 * is an access check (can this user see/post here), not the
 * author-only check used for deleting a specific comment.
 */
export async function assertTaskAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const ownership = await assertListOwnership(task.listId, userId);
  if ("error" in ownership) return ownership;

  return { task, list: ownership.list, project: ownership.project } as const;
}

/**
 * Role-aware project access check (#76 — 5-tier model).
 *
 * Resolution order:
 *   1. Owner — resolved via projects.ownerId (never a project_members row,
 *      per #29 — kept as the single source of truth for true ownership).
 *   2. A direct project_members row, if one exists — this always wins
 *      outright over any team-derived role. Not a merge: "if someone
 *      needs a different role, add them individually instead."
 *   3. Otherwise, the highest-ranked role across all project_teams rows
 *      for teams the user belongs to (editor > contributor > viewer).
 *      Team-derived roles are schema-capped below admin/owner — a team
 *      can never grant either.
 *   4. No direct row and no team grants access → Forbidden.
 */
export const assertProjectAccess = cache(
  async (projectId: string, userId: string): Promise<ProjectAccessResult> => {
    const project = await queries.projects.getById(projectId);
    if (!project) return { error: "Not found" };

    if (project.ownerId === userId) {
      return { project, role: "owner", isOwner: true, membership: null };
    }

    const membership = await queries.projectMembers.getByProjectAndUser(
      projectId,
      userId,
    );
    if (membership) {
      return { project, role: membership.role, isOwner: false, membership };
    }

    const teamIds = await queries.teams.getTeamIdsForUser(userId);
    const teamRoleRows = await queries.projectTeams.getRolesForProjectAndTeams(
      projectId,
      teamIds,
    );
    const role = highestTeamRole(teamRoleRows.map((r) => r.role));
    if (!role) return { error: "Forbidden" };

    return { project, role, isOwner: false, membership: null };
  },
);

/**
 * View access: any resolved role — owner, admin, editor, contributor,
 * or viewer — can view.
 */
export async function assertProjectViewAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessResult> {
  return assertProjectAccess(projectId, userId);
}

/**
 * Edit access: owner, admin, or editor only. Viewer is rejected as
 * before; contributor is now also rejected here — per #76's spec,
 * contributor is limited to moving/completing tasks and commenting,
 * which is narrower than the create/edit/delete/assign scope this check
 * gates. A dedicated contributor-level action gate (move/complete/
 * comment) is #76 Step 3 scope, not this function.
 */
export async function assertProjectEditAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessResult> {
  const access = await assertProjectAccess(projectId, userId);
  if ("error" in access) return access;
  if (access.role === "viewer" || access.role === "contributor") {
    return { error: "Forbidden" };
  }
  return access;
}
/**
 * Edit access: owner, admin, or editor only. Viewer is rejected as
 * before; contributor is now also rejected here — per #76's spec,
 * contributor is limited to moving/completing tasks and commenting,
 * which is narrower than the create/edit/delete/assign scope this check
 * gates. See assertProjectContributeAccess below for that narrower set.
 */

/**
 * Manage access: owner or admin only. Covers the "owner-equivalent
 * minus true ownership transfer" actions per #76's spec — rename/delete
 * project, invite/remove members, change member roles. There is
 * currently no literal ownership-transfer action in the codebase; if
 * one is added later, it must use assertProjectOwnership (strict
 * ownerId check) instead of this function, not the other way around.
 */
export async function assertProjectManageAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessResult> {
  const access = await assertProjectAccess(projectId, userId);
  if ("error" in access) return access;
  if (access.role !== "owner" && access.role !== "admin") {
    return { error: "Forbidden" };
  }
  return access;
}

/**
 * Contribute access: owner, admin, editor, or contributor — everyone
 * except viewer. Scoped specifically to #76's contributor-level action
 * set: moving/completing tasks and commenting. Do not widen this to
 * cover create/edit/delete/assign — those stay behind
 * assertProjectEditAccess, which deliberately excludes contributor.
 */
export async function assertProjectContributeAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessResult> {
  const access = await assertProjectAccess(projectId, userId);
  if ("error" in access) return access;
  if (access.role === "viewer") {
    return { error: "Forbidden" };
  }
  return access;
}

/**
 * List-scoped view access: resolves list -> project, then defers to
 * assertProjectViewAccess (any resolved role passes).
 */
export async function assertListViewAccess(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectViewAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

/**
 * List-scoped edit access: resolves list -> project, then defers to
 * assertProjectEditAccess (owner/admin/editor pass, contributor/viewer
 * rejected).
 */
export async function assertListEditAccess(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectEditAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

/**
 * List-scoped contribute access: resolves list -> project, then defers
 * to assertProjectContributeAccess (owner/admin/editor/contributor
 * pass, viewer rejected).
 */
export async function assertListContributeAccess(
  listId: string,
  userId: string,
) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectContributeAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

/**
 * Task-scoped contribute access: resolves task -> list -> project, then
 * defers to assertProjectContributeAccess.
 */
export async function assertTaskContributeAccess(
  taskId: string,
  userId: string,
) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListContributeAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}

/**
 * Task-scoped view access: resolves task -> list -> project, then
 * defers to assertProjectViewAccess (any resolved role passes).
 */
export async function assertTaskViewAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListViewAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}

/**
 * Task-scoped edit access: resolves task -> list -> project, then
 * defers to assertProjectEditAccess (owner/admin/editor pass,
 * contributor/viewer rejected).
 */
export async function assertTaskEditAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListEditAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}
