"use client";
import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Check,
  Clock,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

// External actions (imported from existing project codebase)
import {
  updateMemberRole,
  removeProjectMember,
  searchUsersForInvite,
  addProjectMember,
} from "@/lib/actions/project-member";

type TeamMember = {
  id: string; // "owner" for the owner row, else the project_members row id
  userId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  activeTaskCount: number;
  recentActivity: {
    id: string;
    taskId: string;
    actorId?: string;
    action:
      | "created"
      | "updated"
      | "moved"
      | "priority_changed"
      | "due_date_changed"
      | "assignee_changed"
      | "description_changed"
      | "comment_added"
      | "comment_deleted"
      | "archived"
      | "restored"
      | "deleted"
      | "completed"
      | "reopened";
    metadata: unknown;
    createdAt: Date;
    taskTitle: string;
  }[];
};

interface ProjectTeamViewProps {
  project: { id: string; name: string; ownerId: string };
  team: TeamMember[];
  canManage: boolean;
  currentUserId: string;
}

type SearchUser = {
  id: string;
  userId?: string;
  email: string;
  name: string;
  status: "available" | "member" | "owner";
  role?: "admin" | "editor" | "contributor" | "viewer";
};

const ACTION_VERBS: Record<string, string> = {
  created: "created task",
  updated: "updated task",
  moved: "moved task",
  priority_changed: "changed priority for",
  due_date_changed: "changed due date for",
  assignee_changed: "changed assignee for",
  description_changed: "updated description for",
  comment_added: "commented on",
  comment_deleted: "deleted a comment on",
  archived: "archived task",
  restored: "restored task",
  deleted: "deleted task",
  completed: "completed task",
  reopened: "reopened task",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(date).getTime()) / 1000,
  );

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function ProjectTeamView({
  project,
  team,
  canManage,
  currentUserId,
}: ProjectTeamViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Invite Dialog State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced user search for invites
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchUsersForInvite(project.id, searchQuery);
        if (res.success) {
          setSearchResults(res.data);
        } else {
          toast({
            title: "Error",
            description: res.error,
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to search users",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, project.id, toast]);

  const handleRoleChange = (
    memberId: string,
    newRole: "admin" | "editor" | "contributor" | "viewer",
  ) => {
    startTransition(async () => {
      const res = await updateMemberRole(project.id, memberId, {
        role: newRole,
      });
      if (res.success) {
        toast({
          title: "Success",
          description: "Member role updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const res = await removeProjectMember(project.id, memberId);
      if (res.success) {
        toast({
          title: "Success",
          description: "Member removed and tasks unassigned.",
        });
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleAddMember = (email: string) => {
    startTransition(async () => {
      const res = await addProjectMember(project.id, { email, role: "viewer" });
      if (res.success) {
        toast({
          title: "Success",
          description: "Member invited successfully.",
        });
        setIsInviteOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back to Teams / Overview Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to teams</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Project Team: {project.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage project members, permissions, and oversight.
          </p>
        </div>

        {canManage && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 text-xs font-medium shadow-sm">
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">
                  Invite Member to {project.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 text-xs bg-muted border-input text-foreground rounded-lg"
                  />
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {isSearching && (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Searching...
                    </p>
                  )}
                  {!isSearching &&
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 border border-transparent transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div
                            className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ring-2 ring-card shrink-0 ${getAvatarColor(
                              user.userId || user.id || user.email,
                            )}`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-medium text-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        {user.status === "available" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isPending}
                            onClick={() => handleAddMember(user.email)}
                            className="h-7 text-xs px-2.5 shadow-none"
                          >
                            Add
                          </Button>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            {user.status === "owner"
                              ? "Owner"
                              : "Already added"}
                          </span>
                        )}
                      </div>
                    ))}
                  {searchQuery &&
                    !isSearching &&
                    searchResults.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No users found.
                      </p>
                    )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Grid of Clean Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => {
          const isOwnerRow = member.role === "owner";
          const [activityModalOpen, setActivityModalOpen] = useState(false);
          const [removeAlertOpen, setRemoveAlertOpen] = useState(false);
          const stableColorKey = member.userId || member.email || member.id;

          return (
            <React.Fragment key={member.id}>
              <div className="relative bg-card backdrop-blur-xl rounded-xl border border-border hover:border-ring transition-all duration-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
                {/* Header Section: Avatar, Name, Email, and Role Badge */}
                <div className="space-y-3 pr-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center justify-center h-9 w-9 rounded-full text-xs font-medium ring-2 ring-card shrink-0 shadow-sm ${getAvatarColor(
                          stableColorKey,
                        )}`}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
                            {member.name}
                          </h3>
                          {member.userId === currentUserId && (
                            <span className="text-[9px] bg-secondary text-secondary-foreground border border-border px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content Footer: Active Task Count & Role Display */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    Active tasks:{" "}
                    <strong className="text-foreground">
                      {member.activeTaskCount}
                    </strong>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground border border-border capitalize">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Absolute Top-Right 3-Dots Action Menu */}
                <div className="absolute top-4 right-4 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-52 bg-card border border-border rounded-xl shadow-xl p-1.5 space-y-0.5 text-left z-50"
                    >
                      {/* See Recent Activity Action */}
                      <DropdownMenuItem
                        onSelect={() => setActivityModalOpen(true)}
                        className="cursor-pointer px-2.5 py-2 text-xs text-foreground focus:bg-muted rounded-lg flex items-center space-x-2"
                      >
                        <Clock size={14} className="text-muted-foreground" />
                        <span>See recent activity</span>
                      </DropdownMenuItem>

                      {/* Edit Access / Role (Only if canManage and not owner row) */}
                      {canManage && !isOwnerRow && (
                        <>
                          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase pt-2">
                            Change Role
                          </div>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleRoleChange(member.id, "editor")
                            }
                            className="cursor-pointer px-2.5 py-1.5 text-xs text-foreground focus:bg-muted rounded-lg flex items-center justify-between"
                          >
                            <span>Editor</span>
                            {member.role === "editor" && (
                              <Check size={14} className="text-foreground" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleRoleChange(member.id, "viewer")
                            }
                            className="cursor-pointer px-2.5 py-1.5 text-xs text-foreground focus:bg-muted rounded-lg flex items-center justify-between"
                          >
                            <span>Viewer</span>
                            {member.role === "viewer" && (
                              <Check size={14} className="text-foreground" />
                            )}
                          </DropdownMenuItem>

                          <div className="border-t border-border pt-1 mt-1">
                            <DropdownMenuItem
                              onSelect={() => setRemoveAlertOpen(true)}
                              className="cursor-pointer px-2.5 py-2 text-xs text-destructive focus:bg-destructive/10 rounded-lg flex items-center space-x-2"
                            >
                              <Trash2 size={14} className="text-destructive" />
                              <span>Remove member</span>
                            </DropdownMenuItem>
                          </div>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Recent Activity Dialog */}
              <Dialog
                open={activityModalOpen}
                onOpenChange={setActivityModalOpen}
              >
                <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-semibold">
                      Recent Activity: {member.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
                    {!member.recentActivity ||
                    member.recentActivity.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No recent activity recorded.
                      </p>
                    ) : (
                      <ul className="space-y-2.5 divide-y divide-border/50">
                        {member.recentActivity.map((act) => (
                          <li
                            key={act.id}
                            className="pt-2 first:pt-0 flex flex-col gap-0.5"
                          >
                            <p className="text-xs text-muted-foreground">
                              {ACTION_VERBS[act.action] || act.action}{" "}
                              <span className="text-foreground font-medium">
                                &ldquo;{act.taskTitle}&rdquo;
                              </span>
                            </p>
                            <span className="text-[10px] text-muted-foreground/80">
                              {formatRelativeTime(act.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Remove Confirmation Alert Dialog */}
              <AlertDialog
                open={removeAlertOpen}
                onOpenChange={setRemoveAlertOpen}
              >
                <AlertDialogContent className="bg-card border border-border rounded-xl shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-sm font-semibold">
                      Are you sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                      This will remove{" "}
                      <strong className="text-foreground">{member.name}</strong>{" "}
                      from the project and automatically unassign all of their
                      current tasks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="h-8 text-xs rounded-lg shadow-none">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleRemoveMember(member.id);
                        setRemoveAlertOpen(false);
                      }}
                      className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg shadow-none font-medium"
                    >
                      Confirm Removal
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
