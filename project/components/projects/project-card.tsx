// components/projects/project-card.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/db/schema";
import {
  addProjectMember,
  getProjectMembers,
} from "@/lib/actions/project-member";
import { updateProject } from "@/lib/actions/projects";
import { ProjectListAction } from "./project-list-action";
import { ProjectDetailModal } from "./modals/project-detail-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Users, Calendar } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  email?: string;
  role: "editor" | "viewer";
};

export function ProjectCard({
  project,
  currentUserId,
  initialMembers = [],
}: {
  project: Project;
  currentUserId: string;
  initialMembers?: Member[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isOwner = project.ownerId === currentUserId;

  const [detailOpen, setDetailOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [isAdding, startAddTransition] = useTransition();

  // Inline rename state (matched to TaskCard pattern)
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const [isRenamePending, startRenameTransition] = useTransition();

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const emailToInvite = inviteEmail.trim();
    const roleToAssign = inviteRole;

    const tempMember: Member = {
      id: `temp-${Date.now()}`,
      userId: `pending-${Math.random()}`,
      email: emailToInvite,
      role: roleToAssign,
    };

    setMembers((prev) => [...prev, tempMember]);
    setInviteEmail("");

    startAddTransition(async () => {
      const result = await addProjectMember(project.id, {
        email: emailToInvite,
        role: roleToAssign,
      });

      if (!result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== tempMember.id));
        toast({
          title: "Failed to add member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Member added",
        description: `Successfully invited ${emailToInvite} as ${roleToAssign}.`,
      });

      const freshMembers = await getProjectMembers(project.id);
      if (freshMembers.success) {
        setMembers(freshMembers.data as Member[]);
      }
      router.refresh();
    });
  }

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name === project.name) {
      setIsRenaming(false);
      setName(project.name);
      return;
    }
    const submittedName = name;
    setIsRenaming(false);

    startRenameTransition(async () => {
      const result = await updateProject(project.id, { name: submittedName });
      if (!result.success) {
        toast({
          title: "Failed to rename project",
          description: result.error,
          variant: "destructive",
        });
        setName(project.name);
        return;
      }
      toast({ title: "Project updated", description: result.data?.name });
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between pr-8">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex-1">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  disabled={isRenamePending}
                  className="h-8 px-2 text-sm font-semibold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus-visible:ring-1"
                />
              </form>
            ) : (
              <Link
                href={`/projects/${project.id}`}
                className="group block flex-1"
              >
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {project.name}
                </h3>
              </Link>
            )}
          </div>

          {project.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2">
              {project.description}
            </p>
          )}

          {project.dueDate && (
            <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mt-3">
              <Calendar size={13} />
              <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Member list preview & quick invite for Owners */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
              <Users size={13} className="text-neutral-400" />
              <span>{members.length + 1} members</span>
            </div>

            {/* Compact avatars/initials */}
            <div className="flex items-center">
              <div className="flex -space-x-1.5">
                <div
                  className="w-6 h-6 rounded-full bg-cyan-500 text-neutral-900 flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-neutral-900"
                  title="Owner"
                >
                  👑
                </div>
                {members.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="w-6 h-6 rounded-full bg-neutral-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-neutral-900 uppercase"
                    title={`${m.email ?? "Member"} (${m.role})`}
                  >
                    {m.email?.[0] ?? "U"}
                  </div>
                ))}
              </div>
              {members.length > 3 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold">
                  +{members.length - 3}
                </span>
              )}
            </div>
          </div>

          {isOwner && (
            <form
              onSubmit={handleAddMember}
              className="flex items-center gap-1.5 pt-1"
            >
              <Input
                placeholder="Add member by email..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isAdding}
                className="h-8 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg flex-1 focus-visible:ring-1"
              />
              <Select
                value={inviteRole}
                onValueChange={(val: "editor" | "viewer") => setInviteRole(val)}
              >
                <SelectTrigger className="w-[85px] h-8 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg shadow-none focus:ring-0">
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
                size="icon"
                disabled={isAdding || !inviteEmail.trim()}
                className="h-8 w-8 shrink-0 bg-cyan-400 hover:bg-cyan-500 text-neutral-900 rounded-lg shadow-none"
                title="Add member"
              >
                <UserPlus size={14} />
              </Button>
            </form>
          )}
        </div>

        {/* Absolute corner action menu */}
        <div
          className="absolute top-3 right-3"
          onClick={(e) => e.preventDefault()}
        >
          <ProjectListAction
            project={project}
            isOwner={isOwner}
            onViewDetails={() => setDetailOpen(true)}
            onRename={() => {
              setName(project.name);
              setIsRenaming(true);
            }}
            members={members}
            onMembersChanged={setMembers}
          />
        </div>
      </div>

      <ProjectDetailModal
        project={project}
        members={members}
        isOwner={isOwner}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onMembersChanged={setMembers}
      />
    </>
  );
}
