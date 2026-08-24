import { queries } from "@/lib/db";
import { assertProjectViewAccess } from "@/lib/services/ownership";
import { ProjectMemberRole } from "@/types";

// ---------- /team workspace hub ----------

export type WorkspaceTeam = {
  id: string;
  name: string;
  memberCount: number;
  createdBy: string;
  projects?: { id: string; name: string }[]; // <-- Add this property
};

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  hasImage?: boolean | null;
  isProjectMember: boolean;
  isTeamMember: boolean;
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

  // Fetch projects once at the top to avoid duplicate declarations
  const projects = await queries.projects.getByOwnerOrMember(userId);
  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

  const [yourTeams, teamsYouBelongTo] = await Promise.all([
    Promise.all(
      yourTeamRows.map(async (t) => {
        const [members, attachedProjects] = await Promise.all([
          queries.teams.getMembers(t.id),
          queries.projectTeams.getByTeam(t.id),
        ]);
        return {
          id: t.id,
          name: t.name,
          memberCount: members.length,
          createdBy: t.createdBy,
          projects: attachedProjects.map((p) => ({
            id: p.projectId,
            name: projectNameMap.get(p.projectId) || "Project",
          })),
        };
      }),
    ),
    Promise.all(
      belongToRows.map(async (t) => {
        const [members, attachedProjects] = await Promise.all([
          queries.teams.getMembers(t.id),
          queries.projectTeams.getByTeam(t.id),
        ]);
        return {
          id: t.id,
          name: t.name,
          memberCount: members.length,
          createdBy: t.createdBy,
          projects: attachedProjects.map((p) => ({
            id: p.projectId,
            name: projectNameMap.get(p.projectId) || "Project",
          })),
        };
      }),
    ),
  ]);

  const projectUserIds = new Set<string>();
  const projectCollaboratorsMap = new Map<string, any>();

  for (const project of projects) {
    const [owner, members] = await Promise.all([
      queries.users.getById(project.ownerId),
      queries.projectMembers.getByProject(project.id),
    ]);

    if (owner && owner.id !== userId) {
      projectUserIds.add(owner.id);
      projectCollaboratorsMap.set(owner.id, {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        imageUrl: owner.imageUrl,
        hasImage: owner.hasImage,
      });
    }

    for (const m of members) {
      if (m.userId !== userId) {
        projectUserIds.add(m.userId);
        if (!projectCollaboratorsMap.has(m.userId)) {
          projectCollaboratorsMap.set(m.userId, {
            id: m.userId,
            name: m.userName,
            email: m.userEmail,
            imageUrl: m.userImageUrl,
            hasImage: m.userHasImage,
          });
        }
      }
    }
  }

  const teamUserIds = new Set<string>();
  const teamCollaboratorsMap = new Map<string, any>();

  for (const t of allTeams) {
    const members = await queries.teams.getMembers(t.id);
    for (const member of members) {
      if (member.userId !== userId) {
        teamUserIds.add(member.userId);
        if (!teamCollaboratorsMap.has(member.userId)) {
          teamCollaboratorsMap.set(member.userId, {
            id: member.userId,
            name: member.userName,
            email: member.userEmail,
            imageUrl: member.userImageUrl,
            hasImage: member.userHasImage,
          });
        }
      }
    }
  }

  const allCollaboratorIds = new Set([...projectUserIds, ...teamUserIds]);

  const workspaceMembers = Array.from(allCollaboratorIds).map((id) => {
    const person =
      projectCollaboratorsMap.get(id) || teamCollaboratorsMap.get(id);
    return {
      ...person,
      isProjectMember: projectUserIds.has(id),
      isTeamMember: teamUserIds.has(id),
    };
  });

  return {
    yourTeams,
    teamsYouBelongTo,
    workspaceMembers,
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
  members: {
    userId: string;
    userName: string;
    userEmail: string;
    imageUrl?: string | null;
    hasImage?: boolean | null;
  }[];
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
            imageUrl: owner.imageUrl,
            hasImage: owner.hasImage,
          },
        ]
      : []),
    ...members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      name: m.userName,
      email: m.userEmail,
      role: m.role,
      imageUrl: m.userImageUrl ?? m.imageUrl,
      hasImage: m.userHasImage ?? m.hasImage,
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

  const teams: ProjectTeamEntry[] = await Promise.all(
    projectTeams.map(async (pt) => {
      const rawMembers = await queries.teams.getMembers(pt.teamId);
      const members = rawMembers.map((m: any) => ({
        userId: m.userId,
        userName: m.userName,
        userEmail: m.userEmail,
        imageUrl: m.userImageUrl ?? m.imageUrl,
        hasImage: m.userHasImage ?? m.hasImage,
      }));
      return {
        projectTeamId: pt.id,
        teamId: pt.teamId,
        teamName: pt.teamName,
        role: pt.role,
        members,
      };
    }),
  );

  return {
    project: access.project,
    role: access.role,
    canManage: access.role === "owner" || access.role === "admin",
    teams,
    individuals,
  };
}

export type EffectiveProjectMember = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImageUrl: string | null;
  userHasImage: boolean;
  role: ProjectMemberRole;
};

export async function getEffectiveProjectMembers(
  projectId: string,
): Promise<EffectiveProjectMember[]> {
  const [project, directMembers, projectTeams] = await Promise.all([
    queries.projects.getById(projectId),
    queries.projectMembers.getByProject(projectId),
    queries.projectTeams.getByProject(projectId),
  ]);

  const ownerId = project?.ownerId;
  const merged = new Map<string, EffectiveProjectMember>();

  for (const m of directMembers) {
    merged.set(m.userId, {
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      userEmail: m.userEmail,
      userImageUrl: m.userImageUrl,
      userHasImage: m.userHasImage,
      role: m.role,
    });
  }

  const teamMemberLists = await Promise.all(
    projectTeams.map((pt) => queries.teams.getMembers(pt.teamId)),
  );

  projectTeams.forEach((pt, i) => {
    for (const member of teamMemberLists[i]) {
      if (member.userId === ownerId) continue;
      if (!merged.has(member.userId)) {
        merged.set(member.userId, {
          id: `team-${pt.teamId}-${member.userId}`,
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          userImageUrl: member.userImageUrl,
          userHasImage: member.userHasImage,
          role: pt.role,
        });
      }
    }
  });

  return Array.from(merged.values());
}
