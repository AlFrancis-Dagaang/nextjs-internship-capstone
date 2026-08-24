// components/projects/project-team/project-team-view.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Users as UsersIcon,
  Trash2,
  Shield,
  MoreHorizontal,
  Mail,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  updateMemberRole,
  removeProjectMember,
} from "@/lib/actions/project-member";
import {
  updateProjectTeamRole,
  detachTeamFromProject,
} from "@/lib/actions/project-team";
import { AddIndividualModal } from "./modals/add-individual-modal";
import { AttachTeamModal } from "./modals/attach-team-modal";
import { getInitials } from "@/lib/utils/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";

type ProjectTeamIndividual = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  activeTaskCount: number;
  recentActivity: unknown[];
  imageUrl?: string | null;
  hasImage?: boolean | null;
};

type ProjectTeamMemberInfo = {
  userId: string;
  userName: string;
  userEmail: string;
  imageUrl?: string | null;
  hasImage?: boolean | null;
};

type ProjectTeamEntry = {
  projectTeamId: string;
  teamId: string;
  teamName: string;
  role: "editor" | "contributor" | "viewer";
  members: ProjectTeamMemberInfo[];
};

type ProjectTeamViewProps = {
  projectId: string;
  initialIndividuals: ProjectTeamIndividual[];
  initialTeams: ProjectTeamEntry[];
  canManage: boolean;
};

const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "contributor", label: "Contributor" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
] as const;

const TEAM_ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "contributor", label: "Contributor" },
  { value: "editor", label: "Editor" },
] as const;

export function ProjectTeamView({
  projectId,
  initialIndividuals,
  initialTeams,
  canManage,
}: ProjectTeamViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [individuals, setIndividuals] = useState(initialIndividuals);
  const [teams, setTeams] = useState(initialTeams);

  useEffect(() => {
    setIndividuals(initialIndividuals);
  }, [initialIndividuals]);

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  // Modal inspection state for team members
  const [inspectingTeam, setInspectingTeam] = useState<ProjectTeamEntry | null>(
    null,
  );

  // Tab state: "individuals" | "teams"
  const [activeTab, setActiveTab] = useState<"individuals" | "teams">(
    "individuals",
  );

  // Modals state
  const [addIndividualOpen, setAddIndividualOpen] = useState(false);
  const [attachTeamOpen, setAttachTeamOpen] = useState(false);

  // Removal confirm dialog state
  const [memberToRemove, setMemberToRemove] =
    useState<ProjectTeamIndividual | null>(null);
  const [teamToDetach, setTeamToDetach] = useState<ProjectTeamEntry | null>(
    null,
  );

  // Handlers — Individuals
  async function handleMemberRoleChange(
    memberId: string,
    newRole: "admin" | "editor" | "contributor" | "viewer",
  ) {
    const prev = individuals;
    setIndividuals((curr) =>
      curr.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );

    startTransition(async () => {
      const result = await updateMemberRole(projectId, memberId, {
        role: newRole,
      });
      if (!result.success) {
        setIndividuals(prev);
        toast({
          title: "Failed to update role",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Role updated successfully" });
      router.refresh();
    });
  }

  async function handleConfirmRemoveMember() {
    if (!memberToRemove) return;
    const target = memberToRemove;
    setMemberToRemove(null);

    const prev = individuals;
    setIndividuals((curr) => curr.filter((m) => m.id !== target.id));

    startTransition(async () => {
      const result = await removeProjectMember(projectId, target.id);
      if (!result.success) {
        setIndividuals(prev);
        toast({
          title: "Failed to remove member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Member removed from project" });
      router.refresh();
    });
  }

  // Handlers — Teams
  async function handleTeamRoleChange(
    projectTeamId: string,
    newRole: "editor" | "contributor" | "viewer",
  ) {
    const prev = teams;
    setTeams((curr) =>
      curr.map((t) =>
        t.projectTeamId === projectTeamId ? { ...t, role: newRole } : t,
      ),
    );

    startTransition(async () => {
      const result = await updateProjectTeamRole(projectId, projectTeamId, {
        role: newRole,
      });
      if (!result.success) {
        setTeams(prev);
        toast({
          title: "Failed to update team role",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Team role updated" });
      router.refresh();
    });
  }

  async function handleConfirmDetachTeam() {
    if (!teamToDetach) return;
    const target = teamToDetach;
    setTeamToDetach(null);

    const prev = teams;
    setTeams((curr) =>
      curr.filter((t) => t.projectTeamId !== target.projectTeamId),
    );

    startTransition(async () => {
      const result = await detachTeamFromProject(
        projectId,
        target.projectTeamId,
      );
      if (!result.success) {
        setTeams(prev);
        toast({
          title: "Failed to detach team",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Team detached from project" });
      router.refresh();
    });
  }

  // Safety effect to fix pointer-events freeze on dialog close
  useEffect(() => {
    if (
      memberToRemove === null &&
      teamToDetach === null &&
      inspectingTeam === null
    ) {
      document.body.style.pointerEvents = "";
    }
  }, [memberToRemove, teamToDetach, inspectingTeam]);

  return (
    <div className="w-full space-y-5 sm:space-y-6 pb-12 px-2 sm:px-0">
      {/* SaaS Tab Header Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div className="flex items-center space-x-1.5 bg-secondary/70 p-1 rounded-2xl border border-border/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("individuals")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "individuals"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UsersIcon size={14} />
            <span>Members</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground">
              {individuals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "teams"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield size={14} />
            <span>Teams</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground">
              {teams.length}
            </span>
          </button>
        </div>

        {/* Action Button for Active Tab */}
        {canManage && (
          <div className="w-full sm:w-auto">
            {activeTab === "individuals" ? (
              <Button
                onClick={() => setAddIndividualOpen(true)}
                className="w-full sm:w-auto h-9 px-4 bg-teal-700 text-white hover:bg-teal-800 text-xs font-medium rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={13} />
                Add Member
              </Button>
            ) : (
              <Button
                onClick={() => setAttachTeamOpen(true)}
                className="w-full sm:w-auto h-9 px-4 bg-teal-700 text-white hover:bg-teal-800 text-xs font-medium rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={13} />
                Add Team
              </Button>
            )}
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: Individuals */}
      {activeTab === "individuals" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {individuals.map((ind) => {
            const isOwnerRow = ind.id === "owner" || ind.role === "owner";
            const avatarKey = ind.userId || ind.email || ind.name;

            return (
              <div
                key={ind.id}
                className="relative flex flex-col justify-between p-4 sm:p-5 border border-border/80 rounded-2xl bg-card shadow-2xs hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                    <UserAvatar
                      userId={avatarKey}
                      name={ind.name || ind.email || "User"}
                      imageUrl={ind.imageUrl}
                      hasImage={ind.hasImage ?? false}
                      className="w-10 h-10 text-xs rounded-xl border border-border shrink-0 shadow-2xs"
                    />
                    <div className="truncate space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground tracking-tight truncate">
                        {ind.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail size={11} className="shrink-0 opacity-70" />
                        <span className="truncate">{ind.email}</span>
                      </p>
                    </div>
                  </div>

                  {canManage && !isOwnerRow && !ind.id.startsWith("team-") ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer"
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 z-50"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Change Role
                        </div>
                        {ROLES.map((r) => (
                          <DropdownMenuItem
                            key={r.value}
                            onSelect={() =>
                              handleMemberRoleChange(ind.id, r.value)
                            }
                            className="cursor-pointer px-2.5 py-1.5 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center justify-between"
                          >
                            <span className="capitalize">{r.label}</span>
                            {ind.role === r.value && (
                              <Check size={13} className="text-teal-600" />
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setMemberToRemove(ind)}
                          className="cursor-pointer px-2.5 py-2 text-xs text-destructive focus:bg-destructive/10 rounded-xl flex items-center space-x-2"
                        >
                          <Trash2 size={13} className="text-destructive" />
                          <span>Remove member</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span
                      title={
                        ind.id.startsWith("team-")
                          ? "Managed via team membership"
                          : undefined
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60 capitalize shrink-0"
                    >
                      {isOwnerRow && (
                        <Shield size={10} className="text-muted-foreground" />
                      )}
                      {ind.role}
                    </span>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[11px] font-medium">Access Level</span>
                  <span className="font-semibold text-foreground capitalize bg-secondary/80 px-2.5 py-0.5 rounded-lg text-[11px]">
                    {ind.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT 2: Teams */}
      {activeTab === "teams" && (
        <div>
          {teams.length === 0 ? (
            <div className="border border-dashed border-border rounded-3xl bg-card p-12 text-center text-xs text-muted-foreground">
              No teams added to this project workspace yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teams.map((t) => (
                <div
                  key={t.projectTeamId}
                  className="relative flex flex-col justify-between p-4 sm:p-5 border border-border/80 rounded-2xl bg-card shadow-2xs hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground border border-border flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                          {getInitials(t.teamName)}
                        </div>
                        <div className="truncate space-y-0.5 min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground tracking-tight truncate">
                            {t.teamName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {t.members?.length || 0} members in this team
                          </p>
                        </div>
                      </div>

                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 z-50"
                          >
                            <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Team Role
                            </div>
                            {TEAM_ROLES.map((r) => (
                              <DropdownMenuItem
                                key={r.value}
                                onSelect={() =>
                                  handleTeamRoleChange(t.projectTeamId, r.value)
                                }
                                className="cursor-pointer px-2.5 py-1.5 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center justify-between"
                              >
                                <span className="capitalize">{r.label}</span>
                                {t.role === r.value && (
                                  <Check size={13} className="text-teal-600" />
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setTeamToDetach(t)}
                              className="cursor-pointer px-2.5 py-2 text-xs text-destructive focus:bg-destructive/10 rounded-xl flex items-center space-x-2"
                            >
                              <Trash2 size={13} className="text-destructive" />
                              <span>Remove team</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border capitalize shrink-0">
                          {t.role}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="text-[11px] font-medium truncate pr-2">
                        Access Scope:{" "}
                        <span className="text-foreground capitalize font-semibold">
                          {t.role}
                        </span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingTeam(t)}
                        className="h-7 text-xs rounded-xl gap-1.5 border-border shrink-0 cursor-pointer"
                      >
                        <Eye size={13} />
                        View Members
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECT TEAM MEMBERS MODAL */}
      <Dialog
        open={inspectingTeam !== null}
        onOpenChange={(open) => !open && setInspectingTeam(null)}
      >
        <DialogContent className="max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 w-[90vw]">
          <DialogHeader className="space-y-1">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <UsersIcon size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Team Roster
              </span>
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
              {inspectingTeam?.teamName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Members belonging to this attached team:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {inspectingTeam?.members && inspectingTeam.members.length > 0 ? (
                inspectingTeam.members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-2.5 bg-secondary/40 border border-border/60 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <UserAvatar
                        userId={m.userId}
                        name={m.userName}
                        imageUrl={m.imageUrl}
                        hasImage={m.hasImage ?? false}
                        className="w-7 h-7 text-[10px] shrink-0"
                      />
                      <div className="truncate">
                        <span className="truncate text-foreground font-semibold block text-xs">
                          {m.userName}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {m.userEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                  No members found in this team.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals & Dialogs */}
      <AddIndividualModal
        projectId={projectId}
        open={addIndividualOpen}
        onOpenChange={setAddIndividualOpen}
      />

      <AttachTeamModal
        projectId={projectId}
        open={attachTeamOpen}
        onOpenChange={setAttachTeamOpen}
      />

      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-card border border-border rounded-3xl shadow-2xl max-w-md p-6 w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold tracking-tight">
              Remove team member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {memberToRemove?.name}
              </span>{" "}
              from this project? They will lose all project-level access
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-9 text-xs rounded-xl m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveMember}
              className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-xl shadow-xs m-0"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={teamToDetach !== null}
        onOpenChange={(open) => !open && setTeamToDetach(null)}
      >
        <AlertDialogContent className="bg-card border border-border rounded-3xl shadow-2xl max-w-md p-6 w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold tracking-tight">
              Remove team?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {teamToDetach?.teamName}
              </span>{" "}
              from this project? Members of this team will lose access unless
              explicitly granted direct individual roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-9 text-xs rounded-xl m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDetachTeam}
              className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-xl shadow-xs m-0"
            >
              Remove Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
