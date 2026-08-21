// components/team/team-card-actions.tsx
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
import type { WorkspaceTeam } from "@/lib/services/team";
import {
  deleteTeam,
  addTeamMember,
  searchUsersForTeamInvite,
} from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchUser = {
  id: string;
  email: string;
  name: string;
};

export function TeamCardActions({
  team,
  onDeleted,
  onViewMembers,
  onRename,
  onMemberAdded,
}: {
  team: WorkspaceTeam;
  onDeleted: (teamId: string) => void;
  onViewMembers: () => void;
  onRename: () => void;
  onMemberAdded: (member: {
    userId: string;
    name: string;
    email: string;
  }) => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "invite">("menu");

  // Live-search user states inside dropdown view
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
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

  // Click outside listener for search dropdown
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

  // Debounced live user search effect using Server Action
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
        const res = await searchUsersForTeamInvite(team.id, trimmed);
        if (currentRequestId !== searchRequestIdRef.current) return;
        if (res.success && res.data) {
          setSearchResults((res.data as SearchUser[]).slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        if (currentRequestId === searchRequestIdRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsLoadingSearch(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, team.id]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    const targetEmail = selectedUser.email;
    const targetName = selectedUser.name;
    const targetUserId = selectedUser.id;

    setIsOpen(false);

    startTransition(async () => {
      const result = await addTeamMember(team.id, { email: targetEmail });

      if (!result.success) {
        toast({
          title: "Failed to add member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      onMemberAdded({
        userId: targetUserId,
        name: targetName,
        email: targetEmail,
      });
      toast({
        title: "Member added successfully",
        description: `${targetEmail} added to team "${team.name}".`,
      });
    });
  }

  return (
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
              <span>Team Options</span>
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
                onViewMembers();
              }}
              className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-lg flex items-center space-x-2.5"
            >
              <ExternalLink size={15} className="text-muted-foreground" />
              <span>Manage members</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setView("invite");
              }}
              className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-lg flex items-center space-x-2.5"
            >
              <UserPlus size={15} className="text-muted-foreground" />
              <span>Add member</span>
            </DropdownMenuItem>

            <div className="pt-1.5 pb-1 border-t border-border mt-1">
              <DropdownMenuItem
                onSelect={() => {
                  setIsOpen(false);
                  onRename();
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-lg flex items-center space-x-2.5"
              >
                <Edit2 size={15} className="text-muted-foreground" />
                <span>Rename team</span>
              </DropdownMenuItem>
            </div>

            <div className="border-t border-border pt-1 mt-1">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  onDeleted(team.id); // Triggers parent confirmation dialog cleanly without duplicate popups
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-destructive focus:bg-destructive/10 rounded-lg flex items-center space-x-2.5"
              >
                <Trash2 size={15} className="text-destructive" />
                <span>Delete team</span>
              </DropdownMenuItem>
            </div>
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

            {/* Add Member Live Search Form */}
            <form onSubmit={handleAddMember} className="space-y-2.5 px-1 pt-1">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Add Team Member
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

                {showDropdown && !selectedUser && query.trim().length >= 2 && (
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
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDropdown(false);
                            }}
                            className="px-2.5 py-2 flex items-center justify-between transition-colors hover:bg-muted cursor-pointer"
                          >
                            <div className="flex flex-col truncate pr-2">
                              <span className="text-xs font-medium text-foreground truncate">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
  );
}
