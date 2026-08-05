// components/projects/modals/invite-member-modal.tsx
"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Loader2 } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import {
  searchUsersForInvite,
  addProjectMember,
  getProjectMembers,
} from "@/lib/actions/project-member";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type InviteMemberModalProps = {
  project: Project;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersChanged: (members: Member[]) => void;
};

export function InviteMemberModal({
  project,
  members,
  open,
  onOpenChange,
  onMembersChanged,
}: InviteMemberModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [isPending, startTransition] = useTransition();

  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedUser(null);
      setRole("viewer");
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [open]);

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    const targetEmail = selectedUser.email;
    const targetName = selectedUser.name;
    const assignedRole = role;

    const tempMember: Member = {
      id: `temp-${Date.now()}`,
      userId: selectedUser.id,
      email: targetEmail,
      name: targetName,
      role: assignedRole,
    };

    onMembersChanged([...members, tempMember]);
    onOpenChange(false);

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
        onMembersChanged(
          fresh.data.map((m) => ({
            id: m.id,
            userId: m.userId,
            email: m.userEmail,
            name: m.userName,
            role: m.role,
          })),
        );
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <DialogHeader className="p-0 space-y-1">
            <DialogTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4 pt-4">
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Search User
            </label>
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
              className="h-9 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg w-full focus-visible:ring-1"
            />

            {showDropdown && !selectedUser && query.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {isLoadingSearch ? (
                  <div className="flex items-center justify-center py-4 text-xs text-neutral-400 gap-2">
                    <Loader2 size={14} className="animate-spin text-cyan-500" />
                    <span>Searching users...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-neutral-400">
                    No matching users found
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
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
                          className={`px-3 py-2.5 flex items-center justify-between transition-colors ${
                            isSelectable
                              ? "hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {user.email}
                            </span>
                          </div>
                          {user.status === "owner" && (
                            <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase">
                              Owner
                            </span>
                          )}
                          {user.status === "member" && (
                            <span className="text-[10px] font-semibold text-neutral-400 uppercase">
                              Already {user.role}
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Assign Role
            </label>
            <Select
              value={role}
              onValueChange={(val: "editor" | "viewer") => setRole(val)}
            >
              <SelectTrigger className="w-full h-9 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg shadow-none focus:ring-0">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl">
                <SelectItem value="viewer" className="text-xs">
                  Viewer (View-only permissions)
                </SelectItem>
                <SelectItem value="editor" className="text-xs">
                  Editor (Can manage tasks & lists)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-lg border-neutral-200 dark:border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedUser}
              className="h-9 px-4 bg-cyan-400 hover:bg-cyan-500 text-neutral-900 text-xs font-medium rounded-lg shadow-none"
            >
              <UserPlus size={14} className="mr-1.5" />
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
