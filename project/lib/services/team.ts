import { queries } from "@/lib/db";
import { assertProjectViewAccess } from "@/lib/services/ownership";

// ---------- /team workspace hub ----------

export type WorkspaceTeam = {
  id: string;
  name: string;
  memberCount: number;
  createdBy: string;
};

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceHub = {
  yourTeams: WorkspaceTeam[];
  teamsYouBelongTo: WorkspaceTeam[];
  workspaceMembers: WorkspaceMember[];
};

/**
 * Team-centric hub for /team (#83, replaces #72's project-centric
 * getTeamOverview). Deliberately carries no project context in any
 * section — that connection is only ever shown from the project side
 * (/projects/[projectId]/team).
 */
export async function getWorkspaceHub(userId: string): Promise<WorkspaceHub> {
  const allTeams = await queries.teams.getForUser(userId);
  const yourTeamRows = allTeams.filter((t) => t.createdBy === userId);
  const belongToRows = allTeams.filter((t) => t.createdBy !== userId);

  const [yourTeams, teamsYouBelongTo] = await Promise.all([
    Promise.all(
      yourTeamRows.map(async (t) => {
        const members = await queries.teams.getMembers(t.id);
        return {
          id: t.id,
          name: t.name,
          memberCount: members.length,
          createdBy: t.createdBy,
        };
      }),
    ),
    Promise.all(
      belongToRows.map(async (t) => {
        const members = await queries.teams.getMembers(t.id);
        return {
          id: t.id,
          name: t.name,
          memberCount: members.length,
          createdBy: t.createdBy,
        };
      }),
    ),
  ]);

  // Workspace Members: union of (a) users sharing a project with this
  // user, and (b) users sharing a team with this user. Not a global
  // directory — no invite/accept flow exists per #29.
  const projects = await queries.projects.getByOwnerOrMember(userId);
  const projectCollaboratorLists = await Promise.all(
    projects.map(async (project) => {
      const [owner, members] = await Promise.all([
        queries.users.getById(project.ownerId),
        queries.projectMembers.getByProject(project.id),
      ]);
      return [
        ...(owner
          ? [{ id: owner.id, name: owner.name, email: owner.email }]
          : []),
        ...members.map((m) => ({
          id: m.userId,
          name: m.userName,
          email: m.userEmail,
        })),
      ];
    }),
  );

  const teamCollaboratorLists = await Promise.all(
    allTeams.map((t) => queries.teams.getMembers(t.id)),
  );

  const collaboratorMap = new Map<string, WorkspaceMember>();
  for (const person of projectCollaboratorLists.flat()) {
    if (person.id !== userId) collaboratorMap.set(person.id, person);
  }
  for (const member of teamCollaboratorLists.flat()) {
    if (member.userId !== userId) {
      collaboratorMap.set(member.userId, {
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
      });
    }
  }

  return {
    yourTeams,
    teamsYouBelongTo,
    workspaceMembers: Array.from(collaboratorMap.values()),
  };
}

// ---------- /projects/[projectId]/team ----------

export type ProjectTeamIndividual = {
  id: string; // "owner" sentinel for the owner row, else projectMembers.id
  userId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  activeTaskCount: number;
  recentActivity: Awaited<
    ReturnType<typeof queries.taskActivity.getByProjectAndActor>
  >;
};

export type ProjectTeamEntry = {
  projectTeamId: string;
  teamId: string;
  teamName: string;
  role: "editor" | "contributor" | "viewer";
};

export type ProjectTeamResult =
  | { error: string }
  | {
      project: NonNullable<
        Awaited<ReturnType<typeof queries.projects.getById>>
      >;
      role: "owner" | "admin" | "editor" | "contributor" | "viewer";
      canManage: boolean;
      teams: ProjectTeamEntry[];
      individuals: ProjectTeamIndividual[];
    };

/**
 * Per-project access lens for /projects/[projectId]/team (#83, replaces
 * #72's /team/[projectId] flat list with a two-section view: teams
 * attached to this project, and individuals with a direct role). No
 * team creation here — that only happens from the /team hub.
 */
export async function getProjectTeam(
  projectId: string,
  userId: string,
): Promise<ProjectTeamResult> {
  const access = await assertProjectViewAccess(projectId, userId);
  if ("error" in access) return access;

  const [owner, members, projectTeams] = await Promise.all([
    queries.users.getById(access.project.ownerId),
    queries.projectMembers.getByProject(projectId),
    queries.projectTeams.getByProject(projectId),
  ]);

  const individualRows = [
    ...(owner
      ? [
          {
            id: "owner",
            userId: owner.id,
            name: owner.name,
            email: owner.email,
            role: "owner" as const,
          },
        ]
      : []),
    ...members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.userName,
      email: m.userEmail,
      role: m.role,
    })),
  ];

  const individuals: ProjectTeamIndividual[] = await Promise.all(
    individualRows.map(async (row) => {
      const [activeTaskCount, recentActivity] = await Promise.all([
        queries.taskAssignees.getActiveCountByProjectAndUser(
          projectId,
          row.userId,
        ),
        queries.taskActivity.getByProjectAndActor(projectId, row.userId, 5),
      ]);
      return { ...row, activeTaskCount, recentActivity };
    }),
  );

  const teams: ProjectTeamEntry[] = projectTeams.map((pt) => ({
    projectTeamId: pt.id,
    teamId: pt.teamId,
    teamName: pt.teamName,
    role: pt.role,
  }));

  return {
    project: access.project,
    role: access.role,
    canManage: access.role === "owner" || access.role === "admin",
    teams,
    individuals,
  };
}
