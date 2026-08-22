// app/(dashboard)/team/page.tsx
import { requireAuthedDbUser } from "@/lib/services/auth";
import { getWorkspaceHub } from "@/lib/services/team";
import { projectsQueries } from "@/lib/db/queries/projects";
import { taskAssigneesQueries } from "@/lib/db/queries/task-assignees";
import { queries } from "@/lib/db";
import { TeamHub } from "@/components/team/team-hub";
import { Users2 } from "lucide-react";

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
      const assignedTasks =
        await taskAssigneesQueries.getAssignedToUserAcrossProjects(member.id);

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

      // Also include projects from assigned tasks
      assignedTasks.forEach((t) => memberProjectIds.add(t.projectId));

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
    <div className="w-full space-y-8 pb-12">
      <div className="p-5 sm:p-6 bg-card/70 backdrop-blur-md border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="p-2.5 bg-secondary text-foreground rounded-2xl border border-border/60 shrink-0">
            <Users2 size={18} />
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground tracking-tight truncate">
              Teams & Directory
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your teams, view memberships, and browse workspace members.
            </p>
          </div>
        </div>
      </div>

      <TeamHub initialHub={enhancedHub} currentUserId={user.id} />
    </div>
  );
}
