import { notFound } from "next/navigation";
import { requireAuthedDbUser } from "@/lib/services/auth";
import { getProjectTeam } from "@/lib/services/team";
import { ProjectTeamView } from "@/components/team/project-team-view";

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireAuthedDbUser();

  const result = await getProjectTeam(projectId, user.id);
  if ("error" in result) {
    notFound();
  }

  return (
    <ProjectTeamView
      project={result.project}
      team={result.team}
      canManage={result.canManage}
      currentUserId={user.id}
    />
  );
}
