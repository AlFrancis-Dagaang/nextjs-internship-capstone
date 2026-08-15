// components/projects/modals/invite-member-modal.tsx
"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import {
  searchUsersForInvite,
  addProjectMember,
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
import { getRealtimeClientId } from "@/lib/realtime/client";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: (projectId: string, member: Member) => void;
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: Member,
  ) => void;
  onMemberRemoved: (projectId: string, memberId: string) => void;
};

export function InviteMemberModal({
  project,
  open,
  onOpenChange,
  onMemberAdded,
  onMemberAddConfirmed,
  onMemberRemoved,
}: InviteMemberModalProps) {
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
    const tempId = `temp-${Date.now()}`;

    const tempMember: Member = {
      id: tempId,
      userId: selectedUser.id,
      email: targetEmail,
      name: targetName,
      role: assignedRole,
    };

    onMemberAdded(project.id, tempMember);
    onOpenChange(false);

    startTransition(async () => {
      const result = await addProjectMember(
        project.id,
        { email: targetEmail, role: assignedRole },
        getRealtimeClientId(),
      );

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <DialogHeader className="p-0 space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground">
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4 pt-4">
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
              className="h-9 text-xs bg-muted border-input text-foreground rounded-lg w-full focus-visible:ring-1"
            />

            {showDropdown && !selectedUser && query.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {isLoadingSearch ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                    <Loader2
                      size={14}
                      className="animate-spin text-foreground"
                    />
                    <span>Searching users...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No matching users found
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
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
                              ? "hover:bg-muted cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          {user.status === "owner" && (
                            <span className="text-[10px] font-semibold text-foreground uppercase">
                              Owner
                            </span>
                          )}
                          {user.status === "member" && (
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assign Role
            </label>
            <Select
              value={role}
              onValueChange={(val: "editor" | "viewer") => setRole(val)}
            >
              <SelectTrigger className="w-full h-9 text-xs bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
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
              className="h-9 text-xs rounded-lg border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedUser}
              className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg shadow-none"
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
