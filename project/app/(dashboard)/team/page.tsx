import { PageHeader } from "@/components/layout/page-header";
import { CreateTeamButton } from "@/components/team/create-team-button";
import { TeamHub } from "@/components/team/team-hub";
import { queries } from "@/lib/db";
import { projectsQueries } from "@/lib/db/queries/projects";
import { taskAssigneesQueries } from "@/lib/db/queries/task-assignees";
import { requireAuthedDbUser } from "@/lib/services/auth";
import { getWorkspaceHub } from "@/lib/services/team";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireAuthedDbUser();
  const [hub, projects] = await Promise.all([
    getWorkspaceHub(user.id),
    projectsQueries.getByOwnerOrMember(user.id),
  ]);

  // Pre-fetch project memberships and attached teams to accurately map project IDs per member
  const enhancedMembers = await Promise.all(
    hub.workspaceMembers.map(async (member) => {
      const rawAssignedTasks =
        await taskAssigneesQueries.getAssignedToUserAcrossProjects(member.id);

      // Map raw rows to match the lighter DTO shape expected by TeamHub
      const assignedTasks = rawAssignedTasks.map((t) => ({
        taskId: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: t.projectName,
        isCompleted: t.isCompleted,
      }));

      const memberProjectIds = new Set<string>();

      for (const p of projects) {
        if (p.ownerId === member.id) {
          memberProjectIds.add(p.id);
          continue;
        }

        // Check direct project members
        const directMembers = await queries.projectMembers.getByProject(p.id);
        if (directMembers.some((m: any) => m.userId === member.id)) {
          memberProjectIds.add(p.id);
          continue;
        }

        // Check team-derived project access
        const attachedTeams = await queries.projectTeams.getByProject(p.id);
        for (const pt of attachedTeams) {
          const teamMembers = await queries.teams.getMembers(pt.teamId);
          if (teamMembers.some((tm: any) => tm.userId === member.id)) {
            memberProjectIds.add(p.id);
            break;
          }
        }
      }

      // Also include projects from assigned tasks (Fixed for Biome compliance)
      for (const t of assignedTasks) {
        memberProjectIds.add(t.projectId);
      }

      return {
        ...member,
        assignedTasks,
        projectIds: Array.from(memberProjectIds),
      };
    }),
  );

  const enhancedHub = {
    ...hub,
    workspaceMembers: enhancedMembers,
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      <PageHeader
        title="Teams & Directory"
        description="Manage your teams, view memberships, and browse workspace members."
      >
        <CreateTeamButton />
      </PageHeader>

      <TeamHub initialHub={enhancedHub} currentUserId={user.id} />
    </div>
  );
}
