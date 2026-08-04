// components/projects/project-detail/project-members.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Shield } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import {
  addProjectMember,
  updateMemberRole,
  removeProjectMember,
  getProjectMembers,
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

type Member = {
  id: string;
  userId: string;
  email?: string;
  role: "editor" | "viewer";
};

type ProjectMembersProps = {
  project: Project;
  members: Member[];
  isOwner: boolean;
  onMembersChanged: (members: Member[]) => void;
};

export function ProjectMembers({
  project,
  members,
  isOwner,
  onMembersChanged,
}: ProjectMembersProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [isPending, startTransition] = useTransition();

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    const targetEmail = email.trim();
    const assignedRole = role;

    const tempMember: Member = {
      id: `temp-${Date.now()}`,
      userId: `pending-${Math.random()}`,
      email: targetEmail,
      role: assignedRole,
    };

    onMembersChanged([...members, tempMember]);
    setEmail("");

    startTransition(async () => {
      const result = await addProjectMember(project.id, {
        email: targetEmail,
        role: assignedRole,
      });

      if (!result.success) {
        onMembersChanged(members.filter((m) => m.id !== tempMember.id));
        toast({
          title: "Failed to add member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Member added successfully",
        description: `${targetEmail} added as ${assignedRole}.`,
      });

      const fresh = await getProjectMembers(project.id);
      if (fresh.success) {
        onMembersChanged(fresh.data as Member[]);
      }
      router.refresh();
    });
  }

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

  async function handleRemove(memberId: string, memberEmail?: string) {
    const prevMembers = [...members];
    onMembersChanged(members.filter((m) => m.id !== memberId));

    startTransition(async () => {
      const result = await removeProjectMember(project.id, memberId);
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
        description: `${memberEmail ?? "User"} was removed from the project.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="w-full md:w-[420px] shrink-0 p-6 flex flex-col overflow-y-auto bg-neutral-50/50 dark:bg-neutral-900/30 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Team Members ({members.length + 1})
        </h4>
      </div>

      {isOwner && (
        <div className="space-y-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Invite Member
          </h4>
          <form onSubmit={handleAddMember} className="flex gap-2">
            <Input
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="h-9 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg flex-1 focus-visible:ring-1"
            />
            <Select
              value={role}
              onValueChange={(val: "editor" | "viewer") => setRole(val)}
            >
              <SelectTrigger className="w-[95px] h-9 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg shadow-none focus:ring-0">
                <SelectValue placeholder="Role" />
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
              type="submit"
              disabled={isPending || !email.trim()}
              className="h-9 px-3 bg-cyan-400 hover:bg-cyan-500 text-neutral-900 text-xs font-medium rounded-lg shadow-none shrink-0"
            >
              <UserPlus size={14} className="mr-1" />
              Invite
            </Button>
          </form>
        </div>
      )}

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm flex-1">
        {/* Owner Row */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-neutral-900 flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-neutral-900 shrink-0">
              👑
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                Owner
              </p>
              <p className="text-[10px] text-neutral-400">Full permissions</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
            <Shield size={10} className="mr-1" /> Owner
          </span>
        </div>

        {/* Other Members */}
        {members.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No other members added yet.
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-xs uppercase ring-2 ring-white dark:ring-neutral-900 shrink-0">
                  {member.email?.[0] ?? "U"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {member.email ?? "Team Member"}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {member.id.startsWith("temp-") ? "Saving..." : "Active"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {isOwner ? (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(val: "editor" | "viewer") =>
                        handleRoleChange(member.id, val)
                      }
                    >
                      <SelectTrigger className="w-[90px] h-7 text-[11px] bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg shadow-none focus:ring-0">
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
                      onClick={() => handleRemove(member.id, member.email)}
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
  );
}
