// components/settings/teams-tab.tsx
"use client"

import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react"
import { useState, useTransition } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useToast } from "@/hooks/use-toast"
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamMembers,
  removeTeamMember,
  searchUsersForTeamInvite,
  updateTeam,
} from "@/lib/actions/team"
import { getInitials } from "@/lib/utils/avatar"

type TeamForUser = {
  id: string
  name: string
  createdBy: string
  createdAt: Date
}

type TeamMember = {
  id: string
  teamId: string
  userId: string
  createdAt: Date
  userName?: string
  userEmail?: string
  imageUrl?: string | null
  hasImage?: boolean | null
}

export function TeamsTab({
  initialTeams,
  currentUserId,
}: {
  initialTeams: TeamForUser[]
  currentUserId: string
}) {
  const { toast } = useToast()
  const [teams, setTeams] = useState<TeamForUser[]>(initialTeams)
  const [isPending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")

  const [renameTeam, setRenameTeam] = useState<TeamForUser | null>(null)
  const [renameName, setRenameName] = useState("")

  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null)

  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [membersMap, setMembersMap] = useState<Record<string, TeamMember[]>>({})
  const [loadingMembersId, setLoadingMembersId] = useState<string | null>(null)

  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!newTeamName.trim()) return

    startTransition(async () => {
      const res = await createTeam({ name: newTeamName.trim() })
      if (res.success) {
        setTeams((prev) => [res.data, ...prev])
        setCreateOpen(false)
        setNewTeamName("")
        toast({
          title: "Team created",
          description: `Successfully created "${res.data.name}".`,
        })
      } else {
        toast({
          title: "Failed to create team",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  function handleRenameTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTeam || !renameName.trim()) return

    startTransition(async () => {
      const res = await updateTeam(renameTeam.id, { name: renameName.trim() })
      if (res.success) {
        setTeams((prev) =>
          prev.map((t) => (t.id === renameTeam.id ? res.data : t)),
        )
        setRenameTeam(null)
        toast({
          title: "Team renamed",
          description: "Team name updated successfully.",
        })
      } else {
        toast({
          title: "Failed to update team",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  function handleDeleteTeam(teamId: string) {
    startTransition(async () => {
      const res = await deleteTeam(teamId)
      if (res.success) {
        setTeams((prev) => prev.filter((t) => t.id !== teamId))
        setDeleteTeamId(null)
        toast({
          title: "Team deleted",
          description: "Team has been removed permanently.",
        })
      } else {
        toast({
          title: "Failed to delete team",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  async function toggleExpandTeam(teamId: string) {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
      return
    }
    setExpandedTeamId(teamId)
    if (!membersMap[teamId]) {
      setLoadingMembersId(teamId)
      const res = await getTeamMembers(teamId)
      if (res.success) {
        const mappedMembers = (res.data as any[]).map((m) => ({
          ...m,
          imageUrl: m.userImageUrl ?? m.imageUrl,
          hasImage: m.userHasImage ?? m.hasImage,
        }))
        setMembersMap(
          (prev): Record<string, TeamMember[]> => ({
            ...prev,
            [teamId]: mappedMembers,
          }),
        )
      } else {
        toast({
          title: "Failed to load members",
          description: res.error,
          variant: "destructive",
        })
      }
      setLoadingMembersId(null)
    }
  }

  async function handleSearchUsers(teamId: string, q: string) {
    setSearchQuery(q)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    const res = await searchUsersForTeamInvite(teamId, q.trim())
    if (res.success) {
      setSearchResults(res.data)
    }
    setIsSearching(false)
  }

  function handleAddMember(teamId: string, email: string) {
    startTransition(async () => {
      const res = await addTeamMember(teamId, { email })
      if (res.success) {
        const membersRes = await getTeamMembers(teamId)
        if (membersRes.success) {
          const mappedMembers = (membersRes.data as any[]).map((m) => ({
            ...m,
            imageUrl: m.userImageUrl ?? m.imageUrl,
            hasImage: m.userHasImage ?? m.hasImage,
          }))
          setMembersMap(
            (prev): Record<string, TeamMember[]> => ({
              ...prev,
              [teamId]: mappedMembers,
            }),
          )
        }
        toast({
          title: "Member added",
          description: "Successfully added member to team.",
        })
        setInviteTeamId(null)
        setSearchQuery("")
        setSearchResults([])
      } else {
        toast({
          title: "Failed to add member",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  function handleRemoveMember(teamId: string, userId: string) {
    startTransition(async () => {
      const res = await removeTeamMember(teamId, userId)
      if (res.success) {
        setMembersMap(
          (prev): Record<string, TeamMember[]> => ({
            ...prev,
            [teamId]: (prev[teamId] || []).filter((m) => m.userId !== userId),
          }),
        )
        toast({
          title: "Member removed",
          description: "Successfully removed member from team.",
        })
      } else {
        toast({
          title: "Failed to remove member",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Teams & Organizations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your teams, view members, and collaborate efficiently.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
        >
          <Plus size={14} className="mr-1.5" />
          Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border/80 rounded-xl bg-muted/20">
          <p className="font-semibold text-foreground text-xs">
            No teams found
          </p>
          <p className="text-[11px] mt-0.5">
            Create your first team organization to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const isOwner = team.createdBy === currentUserId
            const isExpanded = expandedTeamId === team.id
            const members = membersMap[team.id] || []

            return (
              <div
                key={team.id}
                className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-2xs"
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs flex items-center justify-center uppercase shrink-0">
                      {getInitials(team.name)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {team.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {isOwner ? "Created by you" : "Member"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRenameTeam(team)
                            setRenameName(team.name)
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTeamId(team.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpandTeam(team.id)}
                      className="h-7 text-xs border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl cursor-pointer"
                    >
                      <span>Members</span>
                      {isExpanded ? (
                        <ChevronUp size={13} className="ml-1" />
                      ) : (
                        <ChevronDown size={13} className="ml-1" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Team Members
                      </span>
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInviteTeamId(team.id)}
                          className="h-7 text-xs border-border bg-card text-foreground hover:bg-secondary rounded-xl cursor-pointer"
                        >
                          <UserPlus size={13} className="mr-1.5" />
                          Add Member
                        </Button>
                      )}
                    </div>

                    {loadingMembersId === team.id ? (
                      <div className="flex justify-center py-4">
                        <Loader2
                          className="animate-spin text-primary"
                          size={16}
                        />
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No members attached to this team yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60 border border-border/80 rounded-xl bg-card overflow-hidden">
                        {members.map((m) => {
                          const displayName =
                            m.userName || m.userEmail || "Member"
                          const stableKey = m.userId || displayName

                          return (
                            <div
                              key={m.id}
                              className="px-3 py-2 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  userId={stableKey}
                                  name={displayName}
                                  imageUrl={m.imageUrl}
                                  hasImage={m.hasImage ?? false}
                                  className="w-6 h-6 text-[9px] shrink-0"
                                />
                                <span className="font-medium text-foreground">
                                  {displayName}
                                </span>
                              </div>
                              {isOwner && m.userId !== currentUserId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveMember(team.id, m.userId)
                                  }
                                  disabled={isPending}
                                  className="h-6 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dialogs & Modals */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Create Team Organization
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Team Name
              </Label>
              <Input
                autoFocus
                placeholder="Engineering, Design..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="h-8 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !newTeamName.trim()}
                className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer"
              >
                Create Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTeam} onOpenChange={() => setRenameTeam(null)}>
        <DialogContent className="max-w-md bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Rename Team
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameTeam} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Team Name
              </Label>
              <Input
                autoFocus
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTeam(null)}
                className="h-8 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !renameName.trim()}
                className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer"
              >
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!inviteTeamId} onOpenChange={() => setInviteTeamId(null)}>
        <DialogContent className="max-w-md bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Add Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Search User by Email or Name
              </Label>
              <Input
                autoFocus
                placeholder="user@example.com..."
                value={searchQuery}
                onChange={(e) =>
                  inviteTeamId &&
                  handleSearchUsers(inviteTeamId, e.target.value)
                }
                className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-border/60 border border-border/80 rounded-xl bg-card">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="animate-spin text-primary" size={14} />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No matching users found.
                </div>
              ) : (
                searchResults.map((user) => {
                  const isAvailable = user.status === "available"
                  return (
                    <div
                      key={user.id}
                      className="px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {user.name || user.email}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                      {isAvailable ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            inviteTeamId &&
                            handleAddMember(inviteTeamId, user.email)
                          }
                          disabled={isPending}
                          className="h-7 text-xs bg-primary text-primary-foreground rounded-xl cursor-pointer"
                        >
                          Add
                        </Button>
                      ) : (
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {user.status}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTeamId}
        onOpenChange={() => setDeleteTeamId(null)}
      >
        <AlertDialogContent className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Delete Team Organization?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action cannot be undone. All associated team memberships will
              be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="h-8 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeamId && handleDeleteTeam(deleteTeamId)}
              className="h-8 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl cursor-pointer"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
