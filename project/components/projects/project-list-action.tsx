// components/projects/project-list-action.tsx
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  MoreHorizontal,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronLeft,
  X,
  UserPlus,
  Loader2,
} from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { deleteProject } from "@/lib/actions/projects";
import {
  searchUsersForInvite,
  addProjectMember,
} from "@/lib/actions/project-member";
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
  name?: string;
  role: "editor" | "viewer";
};

type SearchUser = {
  id: string;
  email: string;
  name: string;
  status: "available" | "member" | "owner";
  role?: "editor" | "viewer";
};

export function ProjectListAction({
  project,
  isOwner,
  onDeleted,
  onViewDetails,
  onRename,
  onMemberAdded,
  onMemberAddConfirmed,
  onMemberRemoved,
}: {
  project: Project;
  isOwner: boolean;
  onDeleted: (projectId: string) => void;
  onViewDetails: () => void;
  onRename: () => void;
  onMemberAdded: (projectId: string, member: Member) => void;
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: Member,
  ) => void;
  onMemberRemoved: (projectId: string, memberId: string) => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "invite">("menu");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Live-search invite states inside dropdown view
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [isPending, startTransition] = useTransition();

  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

  // Reset view and state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView("menu");
        setQuery("");
        setSelectedUser(null);
        setSearchResults([]);
        setShowDropdown(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside listener for the search dropdown container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live user search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsLoadingSearch(false);
      return;
    }

    setIsLoadingSearch(true);
    setShowDropdown(true);
    const currentRequestId = ++searchRequestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await searchUsersForInvite(project.id, trimmed);
        if (currentRequestId !== searchRequestIdRef.current) return;

        if (result.success) {
          setSearchResults(result.data.slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        if (currentRequestId === searchRequestIdRef.current) {
          console.error("Failed to search users:", err);
          setSearchResults([]);
        }
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsLoadingSearch(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, project.id]);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" was permanently deleted.`,
        });
        setDeleteOpen(false);
        onDeleted(project.id);
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
    if (!selectedUser) return;

    const targetEmail = selectedUser.email;
    const targetName = selectedUser.name;
    const assignedRole = inviteRole;
    const tempId = `temp-${Date.now()}`;

    const tempMember: Member = {
      id: tempId,
      userId: selectedUser.id,
      email: targetEmail,
      name: targetName,
      role: assignedRole,
    };

    onMemberAdded(project.id, tempMember);
    setIsOpen(false);

    startTransition(async () => {
      const result = await addProjectMember(project.id, {
        email: targetEmail,
        role: assignedRole,
      });

      if (!result.success) {
        onMemberRemoved(project.id, tempId);
        toast({
          title: "Failed to add member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      onMemberAddConfirmed(project.id, tempId, {
        id: result.data.id,
        userId: result.data.userId,
        role: result.data.role,
        email: targetEmail,
        name: targetName,
      });

      toast({
        title: "Member added successfully",
        description: `${targetEmail} added as ${assignedRole}.`,
      });
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
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 bg-card border border-border rounded-xl shadow-2xl p-2 space-y-1 text-left z-50"
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
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                <span>Project Options</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>

              <DropdownMenuItem
                onSelect={() => {
                  setIsOpen(false);
                  onViewDetails();
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-lg flex items-center space-x-2.5"
              >
                <ExternalLink size={15} className="text-muted-foreground" />
                <span>Manage project</span>
              </DropdownMenuItem>

              {isOwner && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setView("invite");
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-lg flex items-center space-x-2.5"
                >
                  <UserPlus size={15} className="text-muted-foreground" />
                  <span>Add members</span>
                </DropdownMenuItem>
              )}

              {isOwner && (
                <>
                  <div className="pt-1.5 pb-1 border-t border-border mt-1">
                    <DropdownMenuItem
                      onSelect={() => {
                        setIsOpen(false);
                        onRename();
                      }}
                      className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-lg flex items-center space-x-2.5"
                    >
                      <Edit2 size={15} className="text-muted-foreground" />
                      <span>Rename project</span>
                    </DropdownMenuItem>
                  </div>

                  <div className="border-t border-border pt-1 mt-1">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="cursor-pointer px-2.5 py-2 text-sm text-destructive focus:bg-destructive/10 rounded-lg flex items-center space-x-2.5"
                    >
                      <Trash2 size={15} className="text-destructive" />
                      <span>Delete project</span>
                    </DropdownMenuItem>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="p-1 space-y-3">
              <div className="flex items-center justify-between px-1.5 py-1 border-b border-border">
                <button
                  onClick={() => setView("menu")}
                  className="text-muted-foreground hover:text-foreground p-0.5 flex items-center gap-1 text-xs font-semibold"
                >
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Add Members Live Search Form */}
              <form
                onSubmit={handleAddMember}
                className="space-y-2.5 px-1 pt-1"
              >
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Add Members
                </span>

                <div className="space-y-1 relative" ref={dropdownRef}>
                  <Input
                    placeholder="Search by name or email..."
                    value={selectedUser ? selectedUser.email : query}
                    onChange={(e) => {
                      setSelectedUser(null);
                      setQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (!selectedUser && query.trim().length >= 2)
                        setShowDropdown(true);
                    }}
                    disabled={isPending}
                    className="h-8 text-xs bg-muted border-input text-foreground rounded-lg w-full focus-visible:ring-1"
                  />

                  {showDropdown &&
                    !selectedUser &&
                    query.trim().length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                        {isLoadingSearch ? (
                          <div className="flex items-center justify-center py-3 text-xs text-muted-foreground gap-1.5">
                            <Loader2
                              size={13}
                              className="animate-spin text-foreground"
                            />
                            <span>Searching...</span>
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="py-3 text-center text-xs text-muted-foreground">
                            No matching users
                          </div>
                        ) : (
                          <div className="max-h-[160px] overflow-y-auto divide-y divide-border">
                            {searchResults.map((user) => {
                              const isSelectable = user.status === "available";
                              return (
                                <div
                                  key={user.id}
                                  onClick={() => {
                                    if (!isSelectable) return;
                                    setSelectedUser(user);
                                    setShowDropdown(false);
                                  }}
                                  className={`px-2.5 py-2 flex items-center justify-between transition-colors ${
                                    isSelectable
                                      ? "hover:bg-muted cursor-pointer"
                                      : "opacity-50 cursor-not-allowed"
                                  }`}
                                >
                                  <div className="flex flex-col truncate pr-2">
                                    <span className="text-xs font-medium text-foreground truncate">
                                      {user.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {user.email}
                                    </span>
                                  </div>
                                  {user.status === "owner" && (
                                    <span className="text-[9px] font-semibold text-foreground uppercase shrink-0">
                                      Owner
                                    </span>
                                  )}
                                  {user.status === "member" && (
                                    <span className="text-[9px] font-semibold text-muted-foreground uppercase shrink-0">
                                      Added
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                </div>

                <Select
                  value={inviteRole}
                  onValueChange={(val: "editor" | "viewer") =>
                    setInviteRole(val)
                  }
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
                    <SelectItem value="viewer" className="text-xs">
                      Viewer (View-only)
                    </SelectItem>
                    <SelectItem value="editor" className="text-xs">
                      Editor (Manage tasks)
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  disabled={isPending || !selectedUser}
                  className="w-full h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs shadow-none rounded-lg"
                >
                  <UserPlus size={13} className="mr-1.5" /> Add Member
                </Button>
              </form>
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
