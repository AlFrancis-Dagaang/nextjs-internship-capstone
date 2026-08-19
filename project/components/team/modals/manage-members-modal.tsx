"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceTeam } from "@/lib/services/team";
import {
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
  searchUsersForTeamInvite,
} from "@/lib/actions/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Loader2, Users, Search, Crown } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

type MemberInfo = {
  userId: string;
  name: string;
  email: string;
};

type SearchUser = {
  id: string;
  email: string;
  name: string;
  status: "available" | "member" | "creator";
};

type ManageMembersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: WorkspaceTeam;
  currentUserId: string;
};

export function ManageMembersModal({
  open,
  onOpenChange,
  team,
  currentUserId,
}: ManageMembersModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Team owner/creator can add and remove members.
  // Regular members can still open the modal and browse/search members.
  const isOwner = team.createdBy === currentUserId;

  // Invite search states
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

  // Directory filter search state
  const [filterQuery, setFilterQuery] = useState("");

  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedUser(null);
      setSearchResults([]);
      setShowDropdown(false);
      setFilterQuery("");
      return;
    }

    setLoading(true);

    getTeamMembers(team.id)
      .then((res) => {
        if (res.success && res.data) {
          const mapped: MemberInfo[] = (res.data as any[]).map((m) => ({
            userId: m.userId,
            name: m.userName,
            email: m.userEmail,
          }));

          setMembers(mapped);
        } else {
          setMembers([]);
        }
      })
      .catch(() => {
        setMembers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, team.id]);

  // Click outside listener for invite dropdown
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced live user search for inviting a new member.
  // This only runs when the owner can see/use the invite field.
  useEffect(() => {
    if (!isOwner) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      return;
    }

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

        if (currentRequestId !== searchRequestIdRef.current) {
          return;
        }

        if (res.success && res.data) {
          setSearchResults((res.data as SearchUser[]).slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch {
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
  }, [query, team.id, isOwner]);

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUser || !isOwner) {
      return;
    }

    const targetEmail = selectedUser.email;

    startTransition(async () => {
      const res = await addTeamMember(team.id, {
        email: targetEmail,
      });

      if (res.success) {
        toast({
          title: "Member added to team",
        });

        setQuery("");
        setSelectedUser(null);

        const updatedRes = await getTeamMembers(team.id);

        if (updatedRes.success && updatedRes.data) {
          const mappedUpdated: MemberInfo[] = (updatedRes.data as any[]).map(
            (m) => ({
              userId: m.userId,
              name: m.userName,
              email: m.userEmail,
            }),
          );

          setMembers(mappedUpdated);
        }

        router.refresh();
      } else {
        toast({
          title: "Failed to add member",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleRemoveMember(userId: string) {
    if (!isOwner) {
      return;
    }

    startTransition(async () => {
      const res = await removeTeamMember(team.id, userId);

      if (res.success) {
        toast({
          title: "Member removed from team",
        });

        setMembers((prev) => prev.filter((m) => m.userId !== userId));

        router.refresh();
      } else {
        toast({
          title: "Failed to remove member",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  }

  // Filter existing team members.
  // This is available to both owners and regular members.
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users size={16} />

            <span className="text-xs font-semibold tracking-wider uppercase">
              Team Directory
            </span>
          </div>

          <DialogTitle className="text-base font-semibold tracking-tight text-foreground flex items-center justify-between">
            <span>{team.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Owner-only: Add Member */}
          {isOwner && (
            <form
              onSubmit={handleAddMember}
              className="space-y-2.5 bg-secondary/40 p-3.5 rounded-xl border border-border/60"
            >
              <Label className="text-xs font-medium text-foreground">
                Add Member by Search
              </Label>

              <div className="flex gap-2 relative" ref={dropdownRef}>
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name or email..."
                    value={selectedUser ? selectedUser.email : query}
                    onChange={(e) => {
                      setSelectedUser(null);
                      setQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (!selectedUser && query.trim().length >= 2) {
                        setShowDropdown(true);
                      }
                    }}
                    disabled={isPending}
                    className="h-8 text-xs bg-card border-input text-foreground rounded-lg w-full shadow-sm focus-visible:ring-1"
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

                                  {user.status === "creator" && (
                                    <span className="text-[9px] font-semibold text-foreground uppercase shrink-0">
                                      Creator
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

                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !selectedUser}
                  className="h-8 text-xs gap-1 shadow-sm shrink-0"
                >
                  <UserPlus size={13} />
                  Add
                </Button>
              </div>
            </form>
          )}

          {/* Everyone: Members List & Search */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Team Members ({members.length})
              </Label>
            </div>

            {/* Available to both owner and regular members */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-2.5 text-muted-foreground"
              />

              <Input
                placeholder="Search members..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-8 text-xs pl-8 bg-secondary/50 border-border rounded-lg"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2
                  className="animate-spin text-muted-foreground"
                  size={20}
                />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl py-8 text-center bg-card/50">
                <p className="text-xs text-muted-foreground">
                  {filterQuery
                    ? "No members found matching your search."
                    : "No team members found."}
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-border/40 scrollbar-thin">
                {filteredMembers.map((m) => {
                  const stableKey = m.userId || m.email;

                  const isCreator = team.createdBy === m.userId;

                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold uppercase shadow-sm shrink-0 ${getAvatarColor(
                            stableKey,
                          )}`}
                        >
                          {getInitials(m.name || m.email || "U")}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-foreground truncate">
                              {m.name}
                            </p>

                            {isCreator && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <Crown size={9} />
                                Creator
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-muted-foreground truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      {/* Owner-only: Remove member */}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                          onClick={() => handleRemoveMember(m.userId)}
                          disabled={isPending}
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
