import { queries } from "@/lib/db";
import type {
  ProjectMember,
  ProjectTeamRole,
  ProjectMemberRole,
} from "../db/schema";
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

const ROLE_RANK: Record<ProjectMemberRole, number> = {
  admin: 4,
  editor: 3,
  contributor: 2,
  viewer: 1,
};

export function highestTeamRole(
  roles: ProjectTeamRole[],
): ProjectTeamRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((highest, role) =>
    TEAM_ROLE_RANK[role] > TEAM_ROLE_RANK[highest] ? role : highest,
  );
}

export async function assertProjectOwnership(
  projectId: string,
  userId: string,
) {
  const project = await queries.projects.getById(projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;
  return { project } as const;
}

export async function assertListOwnership(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const project = await queries.projects.getById(list.projectId);
  if (!project) return { error: "Not found" } as const;
  if (project.ownerId !== userId) return { error: "Forbidden" } as const;

  return { list, project } as const;
}

export async function assertTeamOwnership(teamId: string, userId: string) {
  const team = await queries.teams.getById(teamId);
  if (!team) return { error: "Not found" } as const;
  if (team.createdBy !== userId) return { error: "Forbidden" } as const;
  return { team } as const;
}

export async function assertTaskAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const ownership = await assertListOwnership(task.listId, userId);
  if ("error" in ownership) return ownership;

  return { task, list: ownership.list, project: ownership.project } as const;
}

export function resolveEffectiveMemberRole(
  directRole?: ProjectMemberRole,
  teamRole?: ProjectTeamRole | null,
): ProjectMemberRole | undefined {
  if (directRole && teamRole) {
    return ROLE_RANK[teamRole] > ROLE_RANK[directRole] ? teamRole : directRole;
  }
  return directRole ?? teamRole ?? undefined;
}

export const assertProjectAccess = cache(
  async (projectId: string, userId: string): Promise<ProjectAccessResult> => {
    const project = await queries.projects.getById(projectId);
    if (!project) return { error: "Not found" };

    if (project.ownerId === userId) {
      return { project, role: "owner", isOwner: true, membership: null };
    }

    const [membership, teamIds] = await Promise.all([
      queries.projectMembers.getByProjectAndUser(projectId, userId),
      queries.teams.getTeamIdsForUser(userId),
    ]);

    const teamRoleRows = await queries.projectTeams.getRolesForProjectAndTeams(
      projectId,
      teamIds,
    );
    const teamRole = highestTeamRole(teamRoleRows.map((r) => r.role));

    if (!membership && !teamRole) {
      return { error: "Forbidden" };
    }

    if (membership && teamRole) {
      const role =
        ROLE_RANK[teamRole] > ROLE_RANK[membership.role]
          ? teamRole
          : membership.role;
      return { project, role, isOwner: false, membership };
    }

    if (membership) {
      return { project, role: membership.role, isOwner: false, membership };
    }

    return { project, role: teamRole!, isOwner: false, membership: null };
  },
);

export async function assertProjectViewAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessResult> {
  return assertProjectAccess(projectId, userId);
}

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

export async function assertListViewAccess(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectViewAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

export async function assertListEditAccess(listId: string, userId: string) {
  const list = await queries.lists.getById(listId);
  if (!list) return { error: "Not found" } as const;

  const access = await assertProjectEditAccess(list.projectId, userId);
  if ("error" in access) return access;

  return { list, ...access } as const;
}

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

export async function assertTaskViewAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListViewAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}

export async function assertTaskEditAccess(taskId: string, userId: string) {
  const task = await queries.tasks.getById(taskId);
  if (!task) return { error: "Not found" } as const;

  const access = await assertListEditAccess(task.listId, userId);
  if ("error" in access) return access;

  return { task, ...access } as const;
}
