// components/team/team-hub.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceTeam, WorkspaceMember } from "@/lib/services/team";
import { deleteTeam } from "@/lib/actions/team";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Search, CheckSquare, FolderKanban } from "lucide-react";
import { ManageMembersModal } from "./modals/manage-members-modal";
import { TeamCard } from "./team-card";
import { UserAvatar } from "../ui/user-avatar";

type ProjectOption = {
  id: string;
  name: string;
};

type EnhancedWorkspaceMember = WorkspaceMember & {
  isProjectMember: boolean;
  isTeamMember: boolean;
  projectIds?: string[];
  assignedTasks?: {
    taskId: string;
    title: string;
    projectId: string;
    projectName: string;
    isCompleted: boolean;
  }[];
};

type WorkspaceHub = {
  yourTeams: WorkspaceTeam[];
  teamsYouBelongTo: WorkspaceTeam[];
  workspaceMembers: EnhancedWorkspaceMember[];
  projects?: ProjectOption[];
};

export function TeamHub({
  initialHub,
  currentUserId,
}: {
  initialHub: WorkspaceHub;
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [managingTeam, setManagingTeam] = useState<WorkspaceTeam | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Search, Project Filter, and Membership Filter states
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");

  function handleDeleteConfirm() {
    if (!deletingTeamId) return;
    const targetId = deletingTeamId;
    setDeletingTeamId(null);

    startTransition(async () => {
      const res = await deleteTeam(targetId);
      if (res.success) {
        toast({ title: "Team deleted successfully" });
        router.refresh();
      } else {
        toast({
          title: "Failed to delete team",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  }

  // Filter workspace members by search query, membership type, and project association
  const filteredWorkspaceMembers = initialHub.workspaceMembers.filter(
    (member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(memberSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (membershipFilter === "project" && !member.isProjectMember)
        return false;
      if (membershipFilter === "team" && !member.isTeamMember) return false;

      if (selectedProjectId !== "all") {
        const matchesProjectTasks = member.assignedTasks?.some(
          (t) => t.projectId === selectedProjectId,
        );
        const matchesProjectIdList =
          member.projectIds?.includes(selectedProjectId);

        if (!matchesProjectTasks && !matchesProjectIdList) return false;
      }

      return true;
    },
  );

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* SECTION 1: Your Teams */}
      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Your Teams
        </h2>

        {initialHub.yourTeams.length === 0 ? (
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
            {initialHub.yourTeams.map((team) => {
              const creator = initialHub.workspaceMembers.find(
                (m) => m.id === team.createdBy,
              );
              const creatorName = creator?.name || "Team Owner";

              return (
                <div key={team.id} className="w-78 sm:w-92 shrink-0">
                  <TeamCard
                    team={team}
                    creatorName={creatorName}
                    isOwner={team.createdBy === currentUserId}
                    currentUserId={currentUserId}
                    onManageMembers={(t) => setManagingTeam(t)}
                    onDeleted={(id) => setDeletingTeamId(id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Teams You Belong To */}
      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Teams You Belong To
        </h2>

        {initialHub.teamsYouBelongTo.length === 0 ? (
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
            {initialHub.teamsYouBelongTo.map((team) => {
              const creator = initialHub.workspaceMembers.find(
                (m) => m.id === team.createdBy,
              );
              const creatorName = creator?.name || "Team Owner";

              return (
                <div key={team.id} className="w-78 sm:w-92 shrink-0">
                  <TeamCard
                    team={team}
                    creatorName={creatorName}
                    isOwner={team.createdBy === currentUserId}
                    currentUserId={currentUserId}
                    onManageMembers={(t) => setManagingTeam(t)}
                    onDeleted={(id) => setDeletingTeamId(id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: Workspace Members */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Workspace Members
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Membership Type Filter */}
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

            {/* Project Filter Dropdown */}
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
                  {initialHub.projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Search Input */}
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
              const stableKey = member.id || member.email;
              const displayName = member.name || "User";

              const tasksList = member.assignedTasks || [];
              const filteredTasks =
                selectedProjectId === "all"
                  ? tasksList
                  : tasksList.filter((t) => t.projectId === selectedProjectId);

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
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      {managingTeam && (
        <ManageMembersModal
          open={!!managingTeam}
          onOpenChange={(open) => !open && setManagingTeam(null)}
          team={managingTeam}
          currentUserId={currentUserId}
        />
      )}

      <AlertDialog
        open={!!deletingTeamId}
        onOpenChange={(open) => !open && setDeletingTeamId(null)}
      >
        <AlertDialogContent className="bg-card border border-border rounded-3xl shadow-2xl max-w-md p-6 w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold tracking-tight">
              Delete Team?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground pt-1.5">
              This action cannot be undone. This will permanently delete the
              team and remove all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="h-9 sm:h-10 text-xs sm:text-sm rounded-xl m-0"
              disabled={isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="h-9 sm:h-10 text-xs sm:text-sm bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-xl shadow-xs m-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
