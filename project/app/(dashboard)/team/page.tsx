import { requireAuthedDbUser } from "@/lib/services/auth";
import { getWorkspaceHub } from "@/lib/services/team";
import { TeamHub } from "@/components/team/team-hub";
import { Users2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireAuthedDbUser();
  const hub = await getWorkspaceHub(user.id);

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header Container */}
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

      <TeamHub initialHub={hub} currentUserId={user.id} />
    </div>
  );
}
