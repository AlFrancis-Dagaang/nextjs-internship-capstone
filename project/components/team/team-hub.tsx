// components/team/team-hub.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceTeam, WorkspaceMember } from "@/lib/services/team";
import { deleteTeam } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Shield, Mail, Search } from "lucide-react";
import { TeamModal } from "./modals/team-modal";
import { ManageMembersModal } from "./modals/manage-members-modal";
import { TeamCard } from "./team-card";
import { UserAvatar } from "@/components/ui/user-avatar";

type WorkspaceHub = {
  yourTeams: WorkspaceTeam[];
  teamsYouBelongTo: WorkspaceTeam[];
  workspaceMembers: WorkspaceMember[];
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

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<WorkspaceTeam | null>(null);

  const [managingTeam, setManagingTeam] = useState<WorkspaceTeam | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Workspace members search filter state
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  function handleCreateClick() {
    setEditingTeam(null);
    setTeamModalOpen(true);
  }

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

  const filteredWorkspaceMembers = initialHub.workspaceMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchQuery.toLowerCase()),
  );

  return (
    <div className="w-full space-y-12">
      {/* SECTION 1: Your Teams (Carousel) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Your Teams
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">
                {initialHub.yourTeams.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Teams that you own, manage, and configure.
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            size="sm"
            className="h-10 px-4 bg-teal-700 text-white hover:bg-teal-800 text-sm font-medium rounded-xl shadow-2xs gap-2"
          >
            <Plus size={16} />
            Create Team
          </Button>
        </div>

        {initialHub.yourTeams.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 rounded-2xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3.5 shadow-2xs">
                <Users size={20} />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No teams created yet
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-sm">
                Create your first team to bundle members and streamline access
                management across projects.
              </p>
              <Button
                onClick={handleCreateClick}
                variant="outline"
                size="sm"
                className="h-9 text-xs rounded-xl"
              >
                Create Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex overflow-x-auto space-x-5 pb-3 pt-1 scrollbar-thin">
            {initialHub.yourTeams.map((team) => (
              <div key={team.id} className="w-84 sm:w-92 shrink-0">
                <TeamCard
                  team={team}
                  isOwner={team.createdBy === currentUserId}
                  currentUserId={currentUserId}
                  onManageMembers={(t) => setManagingTeam(t)}
                  onDeleted={(id) => setDeletingTeamId(id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Teams You Belong To (Carousel) */}
      <section className="space-y-5">
        <div className="pb-3.5 border-b border-border/80 space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Teams You Belong To
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">
              {initialHub.teamsYouBelongTo.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Collaborative workspaces where you hold membership access.
          </p>
        </div>

        {initialHub.teamsYouBelongTo.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 rounded-2xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3.5 shadow-2xs">
                <Shield size={20} />
              </div>
              <p className="text-xs text-muted-foreground">
                You are not currently a member of any other teams.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex overflow-x-auto space-x-5 pb-3 pt-1 scrollbar-thin">
            {initialHub.teamsYouBelongTo.map((team) => (
              <div key={team.id} className="w-84 sm:w-92 shrink-0">
                <TeamCard
                  team={team}
                  isOwner={false}
                  currentUserId={currentUserId}
                  onManageMembers={(t) => setManagingTeam(t)}
                  onDeleted={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: Workspace Members (Grid with functional search) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-border/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Workspace Members
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">
                {filteredWorkspaceMembers.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              All active participants registered across your projects.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search members..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="h-10 text-sm pl-10 bg-card border-border rounded-xl w-full"
            />
          </div>
        </div>

        {filteredWorkspaceMembers.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 rounded-2xl shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {memberSearchQuery
                  ? "No workspace members found matching your search."
                  : "No workspace members found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredWorkspaceMembers.map((member) => {
              const stableKey = member.id || member.email;
              const displayName = member.name || "User";

              return (
                <div
                  key={member.id}
                  className="relative flex flex-col justify-between p-5 sm:p-6 border border-border/80 rounded-2xl bg-card shadow-2xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center space-x-3.5 overflow-hidden">
                      <UserAvatar
                        userId={stableKey}
                        name={displayName}
                        imageUrl={member.imageUrl}
                        hasImage={member.hasImage ?? false}
                        className="w-11 h-11 text-sm rounded-2xl border border-border shrink-0 shadow-2xs"
                      />
                      <div className="truncate space-y-1">
                        <p className="text-sm font-semibold text-foreground tracking-tight truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                          <Mail size={12} className="shrink-0 opacity-70" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-xs font-medium">Status</span>
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      <TeamModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        team={editingTeam}
      />

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
        <AlertDialogContent className="bg-card border border-border rounded-3xl shadow-2xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold tracking-tight">
              Delete Team?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1.5">
              This action cannot be undone. This will permanently delete the
              team and remove all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel
              className="h-10 text-sm rounded-xl"
              disabled={isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="h-10 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-xl shadow-xs"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
