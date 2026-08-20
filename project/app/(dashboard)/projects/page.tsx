// app/projects/page.tsx
import { getProjects } from "@/lib/actions/projects";
import { getProjectMembers } from "@/lib/actions/project-member";
import { ProjectsList } from "@/components/projects/projects-list";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { queries } from "@/lib/db";
import { toMemberList } from "@/lib/utils/utils";
import {
  highestTeamRole,
  resolveEffectiveMemberRole,
} from "@/lib/services/ownership";
import type { ProjectTeamRole } from "@/types";

export default async function ProjectsPage() {
  const [result, authResult] = await Promise.all([
    getProjects(),
    getAuthedUserOrError(),
  ]);

  if ("error" in authResult) {
    return (
      <div className="p-6 rounded-lg bg-card border border-border text-destructive">
        Error loading user: {authResult.error}
      </div>
    );
  }

  if (!result.success) {
    return (
      <div className="p-6 rounded-lg bg-card border border-border text-destructive">
        Error loading projects: {result.error}
      </div>
    );
  }

  const membersByProject = await Promise.all(
    result.data.map(async (project) => {
      const [membersResult, owner] = await Promise.all([
        getProjectMembers(project.id),
        queries.users.getById(project.ownerId),
      ]);
      const members = membersResult.success
        ? toMemberList(membersResult.data)
        : [];
      return [
        project.id,
        { members, ownerName: owner?.name, ownerEmail: owner?.email },
      ] as const;
    }),
  );

  const initialMembersMap = Object.fromEntries(
    membersByProject.map(([id, v]) => [id, v.members]),
  );

  const initialOwnerMap = Object.fromEntries(
    membersByProject.map(([id, v]) => [
      id,
      { name: v.ownerName, email: v.ownerEmail },
    ]),
  );

  const completionStats = await queries.tasks.getCompletionStatsByProject(
    result.data.map((p) => p.id),
  );

  const initialCompletionMap = Object.fromEntries(
    result.data.map((p) => {
      const stat = completionStats.find((s) => s.projectId === p.id);
      return [
        p.id,
        { total: stat?.total ?? 0, completed: stat?.completed ?? 0 },
      ];
    }),
  );

  const teamIds = await queries.teams.getTeamIdsForUser(authResult.user.id);

  const teamRoleByProject = await Promise.all(
    result.data.map(async (project) => {
      const roleRows = await queries.projectTeams.getRolesForProjectAndTeams(
        project.id,
        teamIds,
      );
      const highest = highestTeamRole(roleRows.map((r) => r.role));
      return [project.id, highest] as const;
    }),
  );

  const initialTeamRoleMap = Object.fromEntries(
    teamRoleByProject.filter(
      (entry): entry is [string, ProjectTeamRole] => entry[1] !== null,
    ),
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      <ProjectsList
        initialProjects={result.data}
        currentUserId={authResult.user.id}
        initialMembersMap={initialMembersMap}
        initialOwnerMap={initialOwnerMap}
        initialCompletionMap={initialCompletionMap}
        initialTeamRoleMap={initialTeamRoleMap}
      />
    </div>
  );
}
