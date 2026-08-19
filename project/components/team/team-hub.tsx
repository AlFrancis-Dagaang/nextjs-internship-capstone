"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceTeam, WorkspaceMember } from "@/lib/services/team";
import { deleteTeam } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import { Plus, Users, Shield } from "lucide-react";
import { TeamModal } from "./modals/team-modal";
import { ManageMembersModal } from "./modals/manage-members-modal";
import { TeamCard } from "./team-card";

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

  function handleCreateClick() {
    setEditingTeam(null);
    setTeamModalOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingTeamId) return;
    startTransition(async () => {
      const res = await deleteTeam(deletingTeamId);
      if (res.success) {
        toast({ title: "Team deleted successfully" });
        setDeletingTeamId(null);
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

  return (
    <div className="space-y-10">
      {/* SECTION 1: Your Teams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Your Teams
            </h2>
            <p className="text-xs text-muted-foreground">
              Teams you created and manage.
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            Create Team
          </Button>
        </div>

        {initialHub.yourTeams.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3 shadow-sm">
                <Users size={18} />
              </div>
              <p className="text-sm font-medium text-foreground">
                No teams created yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm">
                Create your first team to bundle members and streamline access
                management across projects.
              </p>
              <Button onClick={handleCreateClick} variant="outline" size="sm">
                Create Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialHub.yourTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isOwner={team.createdBy === currentUserId}
                currentUserId={currentUserId}
                onManageMembers={(t) => setManagingTeam(t)}
                onDeleted={(id) => setDeletingTeamId(id)}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* SECTION 2: Teams You Belong To */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Teams You Belong To
          </h2>
          <p className="text-xs text-muted-foreground">
            Teams where you are an active member.
          </p>
        </div>

        {initialHub.teamsYouBelongTo.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3 shadow-sm">
                <Shield size={18} />
              </div>
              <p className="text-xs text-muted-foreground">
                You are not currently a member of any other teams.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialHub.teamsYouBelongTo.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isOwner={false}
                currentUserId={currentUserId}
                onManageMembers={(t) => setManagingTeam(t)}
                onDeleted={() => {}}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* SECTION 3: Workspace Members */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Workspace Members
          </h2>
          <p className="text-xs text-muted-foreground">
            All members active across your projects.
          </p>
        </div>

        {initialHub.workspaceMembers.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-muted-foreground">
                No workspace members found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {initialHub.workspaceMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-medium bg-secondary text-secondary-foreground">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
        <AlertDialogContent className="bg-card border-border text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              team and remove all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
