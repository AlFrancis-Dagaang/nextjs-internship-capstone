import { requireAuthedDbUser } from "@/lib/services/auth";
import { getTeamOverview } from "@/lib/services/team";
import { TeamOverviewGrid } from "@/components/team/team-overview-grid";

export default async function TeamPage() {
  const user = await requireAuthedDbUser();
  const projects = await getTeamOverview(user.id);

  return <TeamOverviewGrid projects={projects} />;
}
