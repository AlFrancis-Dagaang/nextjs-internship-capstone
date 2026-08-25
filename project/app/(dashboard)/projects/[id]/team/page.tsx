import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProjectTeamView } from "@/components/projects/project-team/project-team-view"
import { requireAuthedDbUser } from "@/lib/services/auth"
import { getProjectTeam } from "@/lib/services/team"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectTeamPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuthedDbUser()
  const result = await getProjectTeam(id, user.id)

  if ("error" in result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
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
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 transition-colors shadow-2xs"
        >
          <ArrowLeft size={14} /> Back to Project
        </Link>
      </div>
    )
  }

  const formattedRole =
    result.role.charAt(0).toUpperCase() + result.role.slice(1)

  return (
    <div className="w-full space-y-6">
      {/* Header Container */}
      <div className="p-5 sm:p-6 bg-card/70 backdrop-blur-md border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <Link
            href={`/projects/${result.project.id}`}
            className="p-2 hover:bg-secondary rounded-2xl transition-all text-muted-foreground shrink-0 border border-border/60"
            aria-label="Back to project"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h1 className="text-base font-semibold text-foreground tracking-tight truncate">
                {result.project.name} — Team Access
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/60 tracking-wide shrink-0">
                {formattedRole}
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
  )
}
