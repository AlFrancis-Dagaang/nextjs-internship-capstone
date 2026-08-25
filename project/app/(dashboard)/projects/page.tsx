// app/projects/page.tsx

import { ProjectsList } from "@/components/projects/projects-list"
import { getEffectiveProjectMembers } from "@/lib/actions/project-member"
import { getProjects } from "@/lib/actions/projects"
import { queries } from "@/lib/db"
import { getAuthedUserOrError } from "@/lib/services/auth"
import {
  highestTeamRole,
  resolveEffectiveMemberRole,
} from "@/lib/services/ownership"
import { toMemberList } from "@/lib/utils/utils"
import type { ProjectMemberRole, ProjectTeamRole } from "@/types"

export default async function ProjectsPage() {
  const [result, authResult] = await Promise.all([
    getProjects(),
    getAuthedUserOrError(),
  ])

  if ("error" in authResult) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border/80 text-destructive shadow-2xs text-xs">
        Error loading user: {authResult.error}
      </div>
    )
  }

  if (!result.success) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border/80 text-destructive shadow-2xs text-xs">
        Error loading projects: {result.error}
      </div>
    )
  }

  const membersByProject = await Promise.all(
    result.data.map(async (project) => {
      const [membersResult, owner] = await Promise.all([
        getEffectiveProjectMembers(project.id),
        queries.users.getById(project.ownerId),
      ])
      const members = membersResult.success
        ? toMemberList(membersResult.data)
        : []
      return [
        project.id,
        {
          members,
          ownerName: owner?.name,
          ownerEmail: owner?.email,
          ownerImageUrl: owner?.imageUrl,
          ownerHasImage: owner?.hasImage,
        },
      ] as const
    }),
  )

  const initialMembersMap = Object.fromEntries(
    membersByProject.map(([id, v]) => [id, v.members]),
  )

  const initialOwnerMap = Object.fromEntries(
    membersByProject.map(([id, v]) => [
      id,
      {
        name: v.ownerName,
        email: v.ownerEmail,
        imageUrl: v.ownerImageUrl,
        hasImage: v.ownerHasImage,
      },
    ]),
  )
  const completionStats = await queries.tasks.getCompletionStatsByProject(
    result.data.map((p) => p.id),
  )

  const initialCompletionMap = Object.fromEntries(
    result.data.map((p) => {
      const stat = completionStats.find((s) => s.projectId === p.id)
      return [
        p.id,
        { total: stat?.total ?? 0, completed: stat?.completed ?? 0 },
      ]
    }),
  )

  const teamIds = await queries.teams.getTeamIdsForUser(authResult.user.id)

  const teamRoleByProject = await Promise.all(
    result.data.map(async (project) => {
      const roleRows = await queries.projectTeams.getRolesForProjectAndTeams(
        project.id,
        teamIds,
      )
      const highest = highestTeamRole(roleRows.map((r) => r.role))
      return [project.id, highest] as const
    }),
  )

  const initialTeamRoleMap = Object.fromEntries(
    teamRoleByProject.filter(
      (entry): entry is [string, ProjectTeamRole] => entry[1] !== null,
    ),
  )

  const initialMyRoleMap = Object.fromEntries(
    result.data
      .filter((p) => p.ownerId !== authResult.user.id)
      .map((p) => {
        const direct = initialMembersMap[p.id]?.find(
          (m) => m.userId === authResult.user.id,
        )?.role
        const teamRole = initialTeamRoleMap[p.id]
        const role = resolveEffectiveMemberRole(direct, teamRole)
        return [p.id, role] as const
      })
      .filter(
        (entry): entry is [string, ProjectMemberRole] => entry[1] !== undefined,
      ),
  )

  return (
    <div className="space-y-6 w-full min-w-0">
      <ProjectsList
        initialProjects={result.data}
        currentUserId={authResult.user.id}
        initialMembersMap={initialMembersMap}
        initialOwnerMap={initialOwnerMap}
        initialCompletionMap={initialCompletionMap}
        initialMyRoleMap={initialMyRoleMap}
      />
    </div>
  )
}
