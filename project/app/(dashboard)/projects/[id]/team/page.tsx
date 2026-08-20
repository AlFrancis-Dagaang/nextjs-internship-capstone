import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { requireAuthedDbUser } from "@/lib/services/auth";
import { getProjectTeam } from "@/lib/services/team";
import { ProjectTeamView } from "@/components/projects/project-team/project-team-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectTeamPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuthedDbUser();
  const result = await getProjectTeam(id, user.id);

  if ("error" in result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold">
          !
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Access Forbidden or Not Found
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            {result.error ||
              "You do not have permission to view the team access settings for this project."}
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Project
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header breadcrumb & title */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Link
            href={`/projects/${result.project.id}`}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground border border-border"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-foreground tracking-tight">
                {result.project.name} — Team Access
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                <Shield size={10} className="text-muted-foreground" />
                {result.role.charAt(0).toUpperCase() + result.role.slice(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage individual direct members and attached teams for this
              project.
            </p>
          </div>
        </div>
      </div>

      <ProjectTeamView
        projectId={result.project.id}
        initialIndividuals={result.individuals}
        initialTeams={result.teams}
        canManage={result.canManage}
      />
    </div>
  );
}
