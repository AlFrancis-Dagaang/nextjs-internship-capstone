// components/team/team-hub.tsx
"use client"

import { CheckSquare, FolderKanban, Search, Shield, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getTeamMembers } from "@/lib/actions/team"
import type { WorkspaceMember, WorkspaceTeam } from "@/lib/services/team"
import { useTeamStore } from "@/stores/team-store"
import { UserAvatar } from "../ui/user-avatar"
import { ManageMembersModal } from "./modals/manage-members-modal"
import { TeamCard } from "./team-card"

type ProjectOption = {
  id: string
  name: string
}

type MemberInfo = {
  userId: string
  name: string
  email: string
  imageUrl?: string | null
  hasImage?: boolean | null
}

type EnhancedWorkspaceMember = WorkspaceMember & {
  isProjectMember: boolean
  isTeamMember: boolean
  projectIds?: string[]
  assignedTasks?: {
    taskId: string
    title: string
    projectId: string
    projectName: string
    isCompleted: boolean
  }[]
}

type WorkspaceHub = {
  yourTeams: WorkspaceTeam[]
  teamsYouBelongTo: WorkspaceTeam[]
  workspaceMembers: EnhancedWorkspaceMember[]
  projects?: ProjectOption[]
}

export type TeamHubRef = {
  addTeam: (newTeam: WorkspaceTeam) => void
}

export const TeamHub = forwardRef<
  TeamHubRef,
  {
    initialHub: WorkspaceHub
    currentUserId: string
  }
>(function TeamHub({ initialHub, currentUserId }, ref) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [yourTeams, setYourTeams] = useState(initialHub.yourTeams)
  const [teamsYouBelongTo, setTeamsYouBelongTo] = useState(
    initialHub.teamsYouBelongTo,
  )
  const [workspaceMembers, setWorkspaceMembers] = useState(
    initialHub.workspaceMembers,
  )

  // Centralized map of teamId -> MemberInfo[] keeping cards and modals perfectly in sync
  const [teamMembersMap, setTeamMembersMap] = useState<
    Record<string, MemberInfo[]>
  >({})

  useEffect(() => {
    setYourTeams(initialHub.yourTeams)
    setTeamsYouBelongTo(initialHub.teamsYouBelongTo)
    setWorkspaceMembers(initialHub.workspaceMembers)

    // Pre-fetch members for all visible teams on mount
    const allTeams = [...initialHub.yourTeams, ...initialHub.teamsYouBelongTo]
    allTeams.forEach((t) => {
      getTeamMembers(t.id).then((res) => {
        if (res.success && res.data) {
          const mapped: MemberInfo[] = (res.data as any[]).map((m) => ({
            userId: m.userId ?? m.id,
            name: m.userName ?? m.name ?? "",
            email: m.userEmail ?? m.email ?? "",
            imageUrl: m.userImageUrl ?? m.imageUrl ?? m.image ?? null,
            hasImage:
              m.userHasImage ??
              m.hasImage ??
              !!(m.userImageUrl ?? m.imageUrl ?? m.image),
          }))
          setTeamMembersMap((prev) => ({ ...prev, [t.id]: mapped }))
        }
      })
    })
  }, [initialHub])

  useImperativeHandle(ref, () => ({
    addTeam: (newTeam: WorkspaceTeam) => {
      setYourTeams((prev) => [newTeam, ...prev])
    },
  }))

  const newlyCreatedTeam = useTeamStore((state) => state.newlyCreatedTeam)

  useEffect(() => {
    if (!newlyCreatedTeam) {
      return
    }

    setYourTeams((prev) => {
      if (prev.some((team) => team.id === newlyCreatedTeam.id)) {
        return prev
      }

      return [newlyCreatedTeam, ...prev]
    })
  }, [newlyCreatedTeam])

  const [managingTeam, setManagingTeam] = useState<WorkspaceTeam | null>(null)

  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [membershipFilter, setMembershipFilter] = useState<string>("all")

  function handleTeamDeleted(deletedTeamId: string) {
    setYourTeams((prev) => prev.filter((team) => team.id !== deletedTeamId))
    setTeamsYouBelongTo((prev) =>
      prev.filter((team) => team.id !== deletedTeamId),
    )
    setTeamMembersMap((prev) => {
      const copy = { ...prev }
      delete copy[deletedTeamId]
      return copy
    })

    startTransition(() => {
      router.refresh()
    })
  }

  function handleTeamMembersChanged(teamId: string, members: MemberInfo[]) {
    setTeamMembersMap((prev) => ({ ...prev, [teamId]: members }))

    setYourTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, memberCount: members.length } : team,
      ),
    )

    setTeamsYouBelongTo((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, memberCount: members.length } : team,
      ),
    )
  }

  const filteredWorkspaceMembers = workspaceMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchQuery.toLowerCase())

    if (!matchesSearch) {
      return false
    }

    if (membershipFilter === "project" && !member.isProjectMember) {
      return false
    }

    if (membershipFilter === "team" && !member.isTeamMember) {
      return false
    }

    if (selectedProjectId !== "all") {
      const matchesProjectTasks = member.assignedTasks?.some(
        (task) => task.projectId === selectedProjectId,
      )

      const matchesProjectIdList =
        member.projectIds?.includes(selectedProjectId)

      if (!matchesProjectTasks && !matchesProjectIdList) {
        return false
      }
    }

    return true
  })

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Your Teams
        </h2>

        {yourTeams.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 rounded-3xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3.5 shadow-2xs">
                <Users size={20} />
              </div>

              <p className="text-sm font-semibold text-foreground">
                No teams created yet
              </p>

              <p className="text-xs text-muted-foreground mt-1.5 max-w-sm">
                Create your first team using the button above to bundle members
                and streamline access management across projects.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex overflow-x-auto space-x-4 sm:space-x-5 pb-3 pt-1 scrollbar-thin">
            {yourTeams.map((team) => {
              const creator = workspaceMembers.find(
                (member) => member.id === team.createdBy,
              )

              const creatorName = creator?.name || "Team Owner"
              const teamMembers = teamMembersMap[team.id] || []

              return (
                <div key={team.id} className="w-78 sm:w-92 shrink-0">
                  <TeamCard
                    team={team}
                    creatorName={creatorName}
                    isOwner={team.createdBy === currentUserId}
                    currentUserId={currentUserId}
                    initialMembers={teamMembers}
                    onManageMembers={(selectedTeam) =>
                      setManagingTeam(selectedTeam)
                    }
                    onDeleted={handleTeamDeleted}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Teams You Belong To
        </h2>

        {teamsYouBelongTo.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 rounded-3xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-10 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3.5 shadow-2xs">
                <Shield size={20} />
              </div>

              <p className="text-xs text-muted-foreground">
                You are not currently a member of any other teams.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex overflow-x-auto space-x-4 sm:space-x-5 pb-3 pt-1 scrollbar-thin">
            {teamsYouBelongTo.map((team) => {
              const creator = workspaceMembers.find(
                (member) => member.id === team.createdBy,
              )

              const creatorName = creator?.name || "Team Owner"
              const teamMembers = teamMembersMap[team.id] || []

              return (
                <div key={team.id} className="w-78 sm:w-92 shrink-0">
                  <TeamCard
                    team={team}
                    creatorName={creatorName}
                    isOwner={team.createdBy === currentUserId}
                    currentUserId={currentUserId}
                    initialMembers={teamMembers}
                    onManageMembers={(selectedTeam) =>
                      setManagingTeam(selectedTeam)
                    }
                    onDeleted={handleTeamDeleted}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Workspace Members
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <Select
              value={membershipFilter}
              onValueChange={setMembershipFilter}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-card border-border rounded-xl w-full sm:w-44">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="project">Project Members Only</SelectItem>
                <SelectItem value="team">Team Members Only</SelectItem>
              </SelectContent>
            </Select>

            {initialHub.projects && initialHub.projects.length > 0 && (
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-card border-border rounded-xl w-full sm:w-48">
                  <FolderKanban
                    size={14}
                    className="text-muted-foreground mr-2 shrink-0"
                  />

                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {initialHub.projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="h-10 text-xs sm:text-sm pl-10 bg-card border-border rounded-xl w-full"
              />
            </div>
          </div>
        </div>

        {filteredWorkspaceMembers.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 rounded-3xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center px-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {memberSearchQuery ||
                selectedProjectId !== "all" ||
                membershipFilter !== "all"
                  ? "No workspace members found matching your filters."
                  : "No workspace members found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredWorkspaceMembers.map((member) => {
              const stableKey = member.id || member.email
              const displayName = member.name || "User"

              const tasksList = member.assignedTasks || []
              const filteredTasks =
                selectedProjectId === "all"
                  ? tasksList
                  : tasksList.filter(
                      (task) => task.projectId === selectedProjectId,
                    )

              return (
                <div
                  key={stableKey}
                  className="relative flex flex-col justify-between p-4 sm:p-5 border border-border rounded-3xl bg-card shadow-2xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                      <div className="shrink-0">
                        <UserAvatar
                          userId={stableKey}
                          name={displayName}
                          imageUrl={member.imageUrl}
                          hasImage={member.hasImage ?? false}
                          className="w-10 h-10 sm:w-11 sm:h-11 text-xs rounded-2xl border border-border shadow-2xs"
                        />
                      </div>

                      <div className="truncate space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-foreground tracking-tight truncate">
                          {displayName}
                        </p>

                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
                      <CheckSquare
                        size={13}
                        className="text-muted-foreground"
                      />
                      Assigned Tasks
                    </span>

                    <span className="font-semibold text-foreground bg-secondary px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs">
                      {filteredTasks.length}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {managingTeam && (
        <ManageMembersModal
          open={!!managingTeam}
          onOpenChange={(open) => {
            if (!open) {
              setManagingTeam(null)
            }
          }}
          team={managingTeam}
          currentUserId={currentUserId}
          onMembersChanged={(members) =>
            handleTeamMembersChanged(managingTeam.id, members)
          }
        />
      )}
    </div>
  )
})

export default TeamHub
