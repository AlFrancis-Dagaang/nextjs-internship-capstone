import { requireAuthedDbUser } from "@/lib/services/auth";
import { getWorkspaceHub } from "@/lib/services/team";
import { TeamHub } from "@/components/team/team-hub";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireAuthedDbUser();
  const hub = await getWorkspaceHub(user.id);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Teams & Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your teams, view memberships, and browse workspace members.
        </p>
      </div>

      <TeamHub initialHub={hub} currentUserId={user.id} />
    </div>
  );
}
