// components/projects/project-list-action.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  ExternalLink,
  Edit2,
  Users,
  Trash2,
  ChevronLeft,
  X,
  UserPlus,
} from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { deleteProject } from "@/lib/actions/projects";
import { addProjectMember } from "@/lib/actions/project-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteProjectModal } from "./modals/delete-project-modal";

type Member = {
  id: string;
  userId: string;
  email?: string;
  role: "editor" | "viewer";
};

export function ProjectListAction({
  project,
  isOwner,
  onViewDetails,
  onRename,
  members = [],
  onMembersChanged,
}: {
  project: Project;
  isOwner: boolean;
  onViewDetails: () => void;
  onRename: () => void;
  members?: Member[];
  onMembersChanged?: (members: Member[]) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "members">("menu");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fast-invite state within dropdown
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [isPending, startTransition] = useTransition();

  // Reset view to menu when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setView("menu"), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" was permanently deleted.`,
        });
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Failed to delete project",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const targetEmail = inviteEmail.trim();
    const assignedRole = inviteRole;

    const tempMember: Member = {
      id: `temp-${Date.now()}`,
      userId: `pending-${Math.random()}`,
      email: targetEmail,
      role: assignedRole,
    };

    onMembersChanged?.([...members, tempMember]);
    setInviteEmail("");

    startTransition(async () => {
      const result = await addProjectMember(project.id, {
        email: targetEmail,
        role: assignedRole,
      });

      if (!result.success) {
        onMembersChanged?.(members.filter((m) => m.id !== tempMember.id));
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
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            className="h-7 w-7 shrink-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-2 space-y-1 text-left z-50"
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            const target = e.target as Element;
            if (target.closest?.("[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
        >
          {view === "menu" ? (
            <>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                <span>Project Options</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X size={14} />
                </button>
              </div>

              <DropdownMenuItem
                onSelect={() => {
                  setIsOpen(false);
                  onViewDetails();
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
              >
                <ExternalLink size={15} className="text-neutral-400" />
                <span>View details</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setView("members");
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
              >
                <Users size={15} className="text-neutral-400" />
                <span>Manage members</span>
              </DropdownMenuItem>

              {isOwner && (
                <>
                  <div className="pt-1.5 pb-1 border-t border-neutral-100 dark:border-neutral-800 mt-1">
                    <DropdownMenuItem
                      onSelect={() => {
                        setIsOpen(false);
                        onRename();
                      }}
                      className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                    >
                      <Edit2 size={15} className="text-neutral-400" />
                      <span>Rename project</span>
                    </DropdownMenuItem>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-1">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="cursor-pointer px-2.5 py-2 text-sm text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg flex items-center space-x-2.5"
                    >
                      <Trash2 size={15} className="text-red-500" />
                      <span>Delete project</span>
                    </DropdownMenuItem>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="p-1 space-y-3">
              <div className="flex items-center justify-between px-1.5 py-1 border-b border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => setView("menu")}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 flex items-center gap-1 text-xs font-semibold"
                >
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Add Members Form */}
              {isOwner ? (
                <form
                  onSubmit={handleAddMember}
                  className="space-y-2 px-1 pt-1"
                >
                  <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Add Members
                  </span>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={isPending}
                      className="h-8 text-xs bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg flex-1 focus-visible:ring-1"
                    />
                    <Select
                      value={inviteRole}
                      onValueChange={(val: "editor" | "viewer") =>
                        setInviteRole(val)
                      }
                    >
                      <SelectTrigger className="w-[85px] h-8 text-xs bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg shadow-none focus:ring-0">
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
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending || !inviteEmail.trim()}
                    className="w-full h-8 bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium text-xs shadow-none rounded-lg"
                  >
                    <UserPlus size={13} className="mr-1.5" /> Add Member
                  </Button>
                </form>
              ) : (
                <div className="px-2 py-6 text-center text-xs text-neutral-400">
                  Only the project owner can add new members.
                </div>
              )}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteProjectModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        projectName={project.name}
        isPending={isPending}
      />
    </>
  );
}
