import { queries } from "@/lib/db";
import { assertProjectViewAccess } from "@/lib/services/ownership";

const AVATAR_PREVIEW_LIMIT = 5;

export type TeamOverviewProject = {
  id: string;
  name: string;
  memberCount: number;
  avatars: { id: string; name: string }[];
};

/**
 * Cross-project overview for /team. Owner + project_members per project
 * (owner is never a project_members row — #29's design), deduped by
 * construction since they're different sources.
 */
export async function getTeamOverview(
  userId: string,
): Promise<TeamOverviewProject[]> {
  const projects = await queries.projects.getByOwnerOrMember(userId);

  return Promise.all(
    projects.map(async (project) => {
      const [owner, members] = await Promise.all([
        queries.users.getById(project.ownerId),
        queries.projectMembers.getByProject(project.id),
      ]);

      const people = [
        ...(owner ? [{ id: owner.id, name: owner.name }] : []),
        ...members.map((m) => ({ id: m.userId, name: m.userName })),
      ];

      return {
        id: project.id,
        name: project.name,
        memberCount: people.length,
        avatars: people.slice(0, AVATAR_PREVIEW_LIMIT),
      };
    }),
  );
}

export type TeamMember = {
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

export type ProjectTeamResult =
  | { error: string }
  | {
      project: NonNullable<
        Awaited<ReturnType<typeof queries.projects.getById>>
      >;
      role: "owner" | "admin" | "editor" | "contributor" | "viewer";
      canManage: boolean;
      team: TeamMember[];
    };

/**
 * Per-project detail for /team/[projectId]. View-gated per #29/#65's
 * matrix (owner/editor/viewer all pass); canManage flags owner-only —
 * matches assertProjectOwnership's gate on the actual mutation actions
 * in lib/actions/members.ts, which this page calls into directly rather
 * than duplicating.
 */
export async function getProjectTeam(
  projectId: string,
  userId: string,
): Promise<ProjectTeamResult> {
  const access = await assertProjectViewAccess(projectId, userId);
  if ("error" in access) return access;

  const [owner, members] = await Promise.all([
    queries.users.getById(access.project.ownerId),
    queries.projectMembers.getByProject(projectId),
  ]);

  const rows = [
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

  const team: TeamMember[] = await Promise.all(
    rows.map(async (row) => {
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

  return {
    project: access.project,
    role: access.role,
    canManage: access.role === "owner",
    team,
  };
}
