// components/projects/project-detail/project-members.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
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

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "editor" | "viewer";
};

type ProjectMembersProps = {
  project: Project;
  members: Member[];
  isOwner: boolean;
  ownerName?: string;
  ownerEmail?: string;
  onMembersChanged: (members: Member[]) => void;
};

export function ProjectMembers({
  project,
  members,
  isOwner,
  ownerName,
  ownerEmail,
  onMembersChanged,
}: ProjectMembersProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "editor" | "viewer">(
    "all",
  );
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
    newRole: "editor" | "viewer",
  ) {
    const prevMembers = [...members];
    onMembersChanged(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );

    startTransition(async () => {
      const result = await updateMemberRole(project.id, memberId, {
        role: newRole,
      });
      if (!result.success) {
        onMembersChanged(prevMembers);
        toast({
          title: "Failed to update role",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Role updated" });
      router.refresh();
    });
  }

  function confirmRemove() {
    if (!memberToRemove) return;
    const member = memberToRemove;
    setMemberToRemove(null);

    const prevMembers = [...members];
    onMembersChanged(members.filter((m) => m.id !== member.id));

    startTransition(async () => {
      const result = await removeProjectMember(project.id, member.id);
      if (!result.success) {
        onMembersChanged(prevMembers);
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
      router.refresh();
    });
  }

  return (
    <>
      <div className="w-full md:w-[480px] shrink-0 p-6 flex flex-col overflow-y-auto bg-neutral-50/50 dark:bg-neutral-900/30 space-y-5 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800">
        {" "}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Team Members ({members.length + 1})
            </h4>
          </div>
          {isOwner && (
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="h-8 px-3 bg-cyan-400 hover:bg-cyan-500 text-neutral-900 text-xs font-medium rounded-lg shadow-none"
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
              className="absolute left-3 top-2.5 text-neutral-400"
            />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-lg focus-visible:ring-1"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(val: "all" | "editor" | "viewer") =>
              setRoleFilter(val)
            }
          >
            <SelectTrigger className="w-[110px] h-9 text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-lg shadow-none focus:ring-0">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl">
              <SelectItem value="all" className="text-xs">
                All Roles
              </SelectItem>
              <SelectItem value="editor" className="text-xs">
                Editors
              </SelectItem>
              <SelectItem value="viewer" className="text-xs">
                Viewers
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm flex-1">
          {(!searchQuery ||
            ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            roleFilter === "all" && (
              <div className="flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-800/30">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-neutral-900 flex items-center justify-center font-bold text-xs uppercase ring-2 ring-white dark:ring-neutral-900 shrink-0">
                    {ownerName?.[0] ?? ownerEmail?.[0] ?? "U"}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {ownerName ?? "Project Owner"}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {ownerEmail ?? ""}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 shrink-0">
                  <Shield size={10} className="mr-1" /> Owner
                </span>
              </div>
            )}

          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No matching members found.
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-xs uppercase ring-2 ring-white dark:ring-neutral-900 shrink-0">
                    {member.name?.[0] ?? member.email?.[0] ?? "U"}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {member.name ?? "Team Member"}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {member.id.startsWith("temp-")
                        ? "Saving..."
                        : (member.email ?? "Active member")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {isOwner ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(val: "editor" | "viewer") =>
                          handleRoleChange(member.id, val)
                        }
                      >
                        <SelectTrigger className="w-[95px] h-7 text-[11px] bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl">
                          <SelectItem value="viewer" className="text-xs">
                            Viewer
                          </SelectItem>
                          <SelectItem value="editor" className="text-xs">
                            Editor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 capitalize">
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
        members={members}
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onMembersChanged={onMembersChanged}
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
