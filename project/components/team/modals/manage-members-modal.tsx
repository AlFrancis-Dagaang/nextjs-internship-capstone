// components/team/modals/manage-members-modal.tsx
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
import {
  UserPlus,
  Loader2,
  Users,
  Search,
  Crown,
  X,
  Mail,
  FolderKanban,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

type MemberInfo = {
  userId: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  hasImage?: boolean | null;
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

  const isOwner = team.createdBy === currentUserId;

  const [showAddForm, setShowAddForm] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

  const [filterQuery, setFilterQuery] = useState("");
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      setShowAddForm(false);
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
            imageUrl: m.userImageUrl ?? m.imageUrl,
            hasImage: m.userHasImage ?? m.hasImage,
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
        setShowAddForm(false);

        const updatedRes = await getTeamMembers(team.id);

        if (updatedRes.success && updatedRes.data) {
          const mappedUpdated: MemberInfo[] = (updatedRes.data as any[]).map(
            (m) => ({
              userId: m.userId,
              name: m.userName,
              email: m.userEmail,
              imageUrl: m.userImageUrl ?? m.imageUrl,
              hasImage: m.userHasImage ?? m.hasImage,
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

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border text-card-foreground shadow-2xl rounded-3xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users size={15} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Team Directory
            </span>
          </div>
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Attached Projects Section */}
          <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FolderKanban size={14} className="text-muted-foreground" />
              <span>Attached Projects</span>
            </div>
            {team.projects && team.projects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {team.projects.map((proj) => (
                  <span
                    key={proj.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-card text-foreground border border-border/80 shadow-2xs"
                  >
                    {proj.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No projects currently attached to this team.
              </p>
            )}
          </div>

          {isOwner && (
            <div>
              {!showAddForm ? (
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="h-9 px-4 text-xs bg-teal-700 text-white hover:bg-teal-800 rounded-xl gap-1.5 shadow-2xs font-medium"
                >
                  <UserPlus size={14} />
                  Add Member
                </Button>
              ) : (
                <form
                  onSubmit={handleAddMember}
                  className="space-y-2.5 bg-secondary/50 p-3.5 rounded-2xl border border-border/60 relative animate-in fade-in-50 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Search Workspace User
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setQuery("");
                        setSelectedUser(null);
                      }}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-md"
                    >
                      <X size={14} />
                    </button>
                  </div>

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
                        className="h-9 text-xs bg-card border-input text-foreground rounded-xl w-full shadow-2xs focus-visible:ring-1"
                      />

                      {showDropdown &&
                        !selectedUser &&
                        query.trim().length >= 2 && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden py-1">
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
                              <div className="max-h-[160px] overflow-y-auto divide-y divide-border/60">
                                {searchResults.map((user) => {
                                  const isSelectable =
                                    user.status === "available";

                                  return (
                                    <div
                                      key={user.id}
                                      onClick={() => {
                                        if (!isSelectable) return;
                                        setSelectedUser(user);
                                        setShowDropdown(false);
                                      }}
                                      className={`px-3 py-2 flex items-center justify-between transition-colors ${
                                        isSelectable
                                          ? "hover:bg-secondary cursor-pointer"
                                          : "opacity-50 cursor-not-allowed"
                                      }`}
                                    >
                                      <div className="flex flex-col truncate pr-2">
                                        <span className="text-xs font-semibold text-foreground truncate">
                                          {user.name}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground truncate">
                                          {user.email}
                                        </span>
                                      </div>

                                      {user.status === "creator" && (
                                        <span className="text-[10px] font-semibold text-foreground uppercase shrink-0">
                                          Creator
                                        </span>
                                      )}

                                      {user.status === "member" && (
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase shrink-0">
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
                      className="h-9 px-4 text-xs bg-teal-700 text-white hover:bg-teal-800 rounded-xl shadow-2xs shrink-0 font-medium"
                    >
                      Confirm
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Team Members ({members.length})
              </Label>
            </div>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search members..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-9 text-xs pl-9 bg-secondary/50 border-border rounded-xl"
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
              <div className="border border-dashed border-border rounded-2xl py-8 text-center bg-card/40">
                <p className="text-xs text-muted-foreground">
                  {filterQuery
                    ? "No members found matching your search."
                    : "No team members found."}
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                {filteredMembers.map((m) => {
                  const stableKey = m.userId || m.email;
                  const isCreator = team.createdBy === m.userId;
                  const displayName = m.name || m.email || "User";

                  return (
                    <div
                      key={m.userId}
                      className="relative flex flex-col justify-between p-3.5 border border-border/80 rounded-2xl bg-secondary/30 hover:bg-card shadow-2xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <UserAvatar
                            userId={stableKey}
                            name={displayName}
                            imageUrl={m.imageUrl}
                            hasImage={m.hasImage ?? false}
                            className="w-9 h-9 text-xs rounded-xl border border-border shrink-0 shadow-2xs"
                          />
                          <div className="truncate space-y-0.5">
                            <p className="text-xs font-semibold text-foreground tracking-tight truncate">
                              {m.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                              <Mail size={10} className="shrink-0 opacity-70" />
                              {m.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                        {isCreator ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                            <Crown size={9} />
                            Creator
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Member
                          </span>
                        )}

                        {isOwner && !isCreator && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-colors"
                            onClick={() => handleRemoveMember(m.userId)}
                            disabled={isPending}
                          >
                            Remove member
                          </Button>
                        )}
                      </div>
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
