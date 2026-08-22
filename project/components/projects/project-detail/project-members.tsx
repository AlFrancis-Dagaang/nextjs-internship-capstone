// components/projects/project-detail/project-members.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { Trash2, Shield, UserPlus, Search } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import {
  updateMemberRole,
  removeProjectMember,
} from "@/lib/actions/project-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { InviteMemberModal } from "../modals/invite-member-modal";
import { DeleteMemberModal } from "../modals/delete-member-modal";
import { getRealtimeClientId } from "@/lib/realtime/client";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Member } from "@/stores/project-store"; // <--- Import from store

type ProjectMembersProps = {
  project: Project;
  members: Member[];
  isOwner: boolean;
  canManage: boolean;
  ownerName?: string;
  ownerEmail?: string;
  ownerImageUrl?: string | null;
  ownerHasImage?: boolean | null;
  onMemberAdded: (projectId: string, member: Member) => void;
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: Member,
  ) => void;
  onMemberRoleChanged: (projectId: string, member: Member) => void;
  onMemberRemoved: (projectId: string, memberId: string) => void;
};

export function ProjectMembers({
  project,
  members,
  isOwner,
  canManage,
  ownerName,
  ownerEmail,
  ownerImageUrl,
  ownerHasImage,
  onMemberAdded,
  onMemberAddConfirmed,
  onMemberRoleChanged,
  onMemberRemoved,
}: ProjectMembersProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "owner" | "admin" | "editor" | "contributor" | "viewer"
  >("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        m.email?.toLowerCase().includes(q) ||
        m.name?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  async function handleRoleChange(
    memberId: string,
    newRole: "admin" | "editor" | "contributor" | "viewer",
  ) {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const prev = target;
    onMemberRoleChanged(project.id, { ...target, role: newRole });

    startTransition(async () => {
      const result = await updateMemberRole(project.id, memberId, {
        role: newRole,
      });
      if (!result.success) {
        onMemberRoleChanged(project.id, prev);
        toast({
          title: "Failed to update role",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Role updated" });
    });
  }

  function confirmRemove() {
    if (!memberToRemove) return;
    const member = memberToRemove;
    setMemberToRemove(null);
    onMemberRemoved(project.id, member.id);

    startTransition(async () => {
      const result = await removeProjectMember(
        project.id,
        member.id,
        getRealtimeClientId(),
      );
      if (!result.success) {
        onMemberAdded(project.id, member);
        toast({
          title: "Failed to remove member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Member removed",
        description: `${member.name ?? member.email ?? "User"} was removed from the project.`,
      });
    });
  }

  const ownerDisplayName = ownerName || ownerEmail || "Project Owner";

  return (
    <>
      <div className="w-full md:w-120 shrink-0 p-6 flex flex-col overflow-y-auto bg-muted/30 space-y-5 border-t md:border-t-0 md:border-l border-border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Team Members ({members.length + 1})
            </h4>
          </div>
          {canManage && (
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg shadow-none"
            >
              <UserPlus size={14} className="mr-1.5" />
              Add Member
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-muted-foreground"
            />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs bg-card border-border text-foreground rounded-lg focus-visible:ring-1"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(
              val: "all" | "admin" | "editor" | "contributor" | "viewer",
            ) => setRoleFilter(val)}
          >
            <SelectTrigger className="w-27.5 h-9 text-xs bg-card border-border text-foreground rounded-lg shadow-none focus:ring-0">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
              <SelectItem value="all" className="text-xs">
                All Roles
              </SelectItem>
              <SelectItem value="admin" className="text-xs">
                Admins
              </SelectItem>
              <SelectItem value="editor" className="text-xs">
                Editors
              </SelectItem>
              <SelectItem value="contributor" className="text-xs">
                Contributors
              </SelectItem>
              <SelectItem value="viewer" className="text-xs">
                Viewers
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card shadow-sm flex-1">
          {(!searchQuery ||
            ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            roleFilter === "all" && (
              <div className="flex items-center justify-between p-3.5 bg-muted/40">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <UserAvatar
                    userId={project.ownerId || ownerEmail || "owner"}
                    name={ownerDisplayName}
                    imageUrl={ownerImageUrl}
                    hasImage={ownerHasImage ?? false}
                    className="w-8 h-8 text-xs"
                  />
                  <div className="truncate">
                    <p className="text-xs font-medium text-foreground truncate">
                      {ownerName ?? "Project Owner"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ownerEmail ?? ""}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground shrink-0 border border-border">
                  <Shield size={10} className="mr-1" /> Owner
                </span>
              </div>
            )}

          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching members found.
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <UserAvatar
                    userId={member.userId || member.email || member.id}
                    name={member.name || member.email || "Member"}
                    imageUrl={member.imageUrl}
                    hasImage={member.hasImage ?? false}
                    className="w-8 h-8 text-xs"
                  />
                  <div className="truncate">
                    <p className="text-xs font-medium text-foreground truncate">
                      {member.name ?? "Team Member"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {member.id.startsWith("temp-")
                        ? "Saving..."
                        : (member.email ?? "Active member")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {canManage && !member.id.startsWith("team-") ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(
                          val: "admin" | "editor" | "contributor" | "viewer",
                        ) => handleRoleChange(member.id, val)}
                      >
                        <SelectTrigger className="w-23.75 h-7 text-[11px] bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
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
                        onClick={() => setMemberToRemove(member)}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </>
                  ) : (
                    <span
                      title="Managed via team membership"
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground capitalize border border-border"
                    >
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <InviteMemberModal
        project={project}
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onMemberAdded={onMemberAdded}
        onMemberAddConfirmed={onMemberAddConfirmed}
        onMemberRemoved={onMemberRemoved}
      />

      <DeleteMemberModal
        isOpen={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemove}
        memberName={
          memberToRemove?.name ?? memberToRemove?.email ?? "this member"
        }
        isPending={isPending}
      />
    </>
  );
}
