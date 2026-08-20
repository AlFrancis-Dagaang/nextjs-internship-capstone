"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users as UsersIcon, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

type ProjectTeamIndividual = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  activeTaskCount: number;
  recentActivity: unknown[];
};

type ProjectTeamEntry = {
  projectTeamId: string;
  teamId: string;
  teamName: string;
  role: "editor" | "contributor" | "viewer";
};

type ProjectTeamViewProps = {
  projectId: string;
  initialIndividuals: ProjectTeamIndividual[];
  initialTeams: ProjectTeamEntry[];
  canManage: boolean;
};

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

  return (
    <div className="space-y-8">
      {/* SECTION 1: Individuals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UsersIcon size={16} className="text-muted-foreground" />
              Direct Individuals ({individuals.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Users granted specific access roles directly on this project.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => setAddIndividualOpen(true)}
              className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg shadow-none"
            >
              <UserPlus size={14} className="mr-1.5" />
              Add Member
            </Button>
          )}
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm divide-y divide-border">
          {individuals.map((ind) => {
            const isOwnerRow = ind.id === "owner" || ind.role === "owner";
            const avatarKey = ind.userId || ind.email || ind.name;

            return (
              <div
                key={ind.id}
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ${getAvatarColor(avatarKey)}`}
                  >
                    {getInitials(ind.name || ind.email || "U")}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-foreground truncate">
                      {ind.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ind.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {canManage && !isOwnerRow ? (
                    <>
                      <Select
                        value={ind.role}
                        onValueChange={(
                          val: "admin" | "editor" | "contributor" | "viewer",
                        ) => handleMemberRoleChange(ind.id, val)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
                          <SelectItem value="viewer" className="text-xs">
                            Viewer
                          </SelectItem>
                          <SelectItem value="contributor" className="text-xs">
                            Contributor
                          </SelectItem>
                          <SelectItem value="editor" className="text-xs">
                            Editor
                          </SelectItem>
                          <SelectItem value="admin" className="text-xs">
                            Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(ind)}
                        disabled={isPending}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border capitalize">
                      {isOwnerRow && <Shield size={10} />}
                      {ind.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Teams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UsersIcon size={16} className="text-muted-foreground" />
              Attached Teams ({teams.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Teams granted access rights collectively to this project.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => setAttachTeamOpen(true)}
              className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg shadow-none"
            >
              <UserPlus size={14} className="mr-1.5" />
              Attach Team
            </Button>
          )}
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm divide-y divide-border">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No teams attached to this project yet.
            </div>
          ) : (
            teams.map((t) => (
              <div
                key={t.projectTeamId}
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground border border-border flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {getInitials(t.teamName)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-foreground truncate">
                      {t.teamName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Team Scope
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {canManage ? (
                    <>
                      <Select
                        value={t.role}
                        onValueChange={(
                          val: "editor" | "contributor" | "viewer",
                        ) => handleTeamRoleChange(t.projectTeamId, val)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
                          <SelectItem value="viewer" className="text-xs">
                            Viewer
                          </SelectItem>
                          <SelectItem value="contributor" className="text-xs">
                            Contributor
                          </SelectItem>
                          <SelectItem value="editor" className="text-xs">
                            Editor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTeamToDetach(t)}
                        disabled={isPending}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Detach team"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border capitalize">
                      {t.role}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
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

      {/* Remove Member Confirmation Alert Dialog */}
      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-card border border-border rounded-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              Remove team member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {memberToRemove?.name}
              </span>{" "}
              from this project? They will lose all project-level access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveMember}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detach Team Confirmation Alert Dialog */}
      <AlertDialog
        open={teamToDetach !== null}
        onOpenChange={(open) => !open && setTeamToDetach(null)}
      >
        <AlertDialogContent className="bg-card border border-border rounded-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              Detach team?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to detach{" "}
              <span className="font-medium text-foreground">
                {teamToDetach?.teamName}
              </span>{" "}
              from this project? Members of this team will lose access unless
              granted direct roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDetachTeam}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              Detach
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
