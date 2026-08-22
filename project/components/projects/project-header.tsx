// components/projects/project-header.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  MoreVertical,
  Archive,
  UserPlus,
  ListChecks,
  ChevronDown,
  FolderInput,
  Trash2,
  Calendar,
  Users2,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/db/schema";
import { InviteMemberModal } from "./modals/invite-member-modal";
import { useProjectStore, type Member } from "@/stores/project-store";
import { useUiStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { ArchivedTasksModal } from "../tasks/modal/archived-tasks-modal";
import { DeleteTaskDialog } from "@/components/tasks/modal/delete-task-dialog";
import { moveTaskToList, deleteTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeProject } from "@/hooks/use-realtime-project";
import type { ProjectRealtimeEvent } from "@/lib/realtime/server";
import { CalendarTaskDTO } from "@/types";
import { ProjectCalendarModal } from "./modals/project-calendar-modal";
import { UserAvatar } from "@/components/ui/user-avatar";

export function ProjectHeader({
  project,
  initialMembers,
  isOwner,
  canManage,
  ownerName,
  ownerEmail,
  ownerImageUrl,
  ownerHasImage,
  role,
  currentUserId,
  upcomingTasks,
}: {
  project: Project;
  initialMembers: Member[];
  isOwner: boolean;
  canManage: boolean;
  ownerName?: string;
  ownerEmail?: string;
  ownerImageUrl?: string | null;
  ownerHasImage?: boolean | null;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  currentUserId: string;
  upcomingTasks: CalendarTaskDTO[];
}) {
  const { toast } = useToast();
  const canEdit = role !== "viewer" && role !== "contributor";
  const membersState = useProjectStore(
    (s) => s.membersMap[project.id] ?? initialMembers,
  );
  const setProjectMembers = useProjectStore((s) => s.setProjectMembers);
  const addMember = useProjectStore((s) => s.addMember);
  const replaceOptimisticMember = useProjectStore(
    (s) => s.replaceOptimisticMember,
  );
  const removeMember = useProjectStore((s) => s.removeMember);

  useEffect(() => {
    setProjectMembers(project.id, initialMembers);
  }, [project.id, initialMembers, setProjectMembers]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [bulkActionsDropdownOpen, setBulkActionsDropdownOpen] = useState(false);

  // Calendar modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // UI Store — search & filters
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const filterCompleted = useUiStore((s) => s.filterCompleted);
  const setFilterCompleted = useUiStore((s) => s.setFilterCompleted);
  const filterPriority = useUiStore((s) => s.filterPriority);
  const setFilterPriority = useUiStore((s) => s.setFilterPriority);
  const filterDueDate = useUiStore((s) => s.filterDueDate);
  const setFilterDueDate = useUiStore((s) => s.setFilterDueDate);
  const filterAssignedToMe = useUiStore((s) => s.filterAssignedToMe);
  const setFilterAssignedToMe = useUiStore((s) => s.setFilterAssignedToMe);
  const filterAssigneeId = useUiStore((s) => s.filterAssigneeId);
  const setFilterAssigneeId = useUiStore((s) => s.setFilterAssigneeId);
  const clearAllFilters = useUiStore((s) => s.clearAllFilters);

  // UI Store — selection mode / bulk ops
  const selectionMode = useUiStore((s) => s.selectionMode);
  const selectedTaskIds = useUiStore((s) => s.selectedTaskIds);
  const enterSelectionMode = useUiStore((s) => s.enterSelectionMode);
  const exitSelectionMode = useUiStore((s) => s.exitSelectionMode);
  const clearSelection = useUiStore((s) => s.clearSelection);
  const bulkDeleteRequestToken = useUiStore((s) => s.bulkDeleteRequestToken);

  const lists = useBoardStore((s) => s.lists);
  const removeTask = useBoardStore((s) => s.removeTask);
  const reconcileTaskMoved = useBoardStore((s) => s.reconcileTaskMoved);

  const isFilterActive =
    filterCompleted !== "all" ||
    filterPriority !== "all" ||
    filterDueDate !== "all" ||
    filterAssignedToMe ||
    filterAssigneeId !== null;

  const isFilteringActive = searchQuery.trim() !== "" || isFilterActive;

  useEffect(() => {
    if (isFilteringActive && selectionMode) {
      exitSelectionMode();
    }
  }, [isFilteringActive, selectionMode, exitSelectionMode]);

  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkPending, startBulkTransition] = useTransition();
  const prevBulkDeleteToken = useRef(bulkDeleteRequestToken);

  useEffect(() => {
    if (
      bulkDeleteRequestToken !== prevBulkDeleteToken.current &&
      selectedTaskIds.length > 0
    ) {
      setBulkDeleteConfirmOpen(true);
    }
    prevBulkDeleteToken.current = bulkDeleteRequestToken;
  }, [bulkDeleteRequestToken, selectedTaskIds.length]);

  function handleBulkMove(targetListId: string) {
    if (selectedTaskIds.length === 0) return;
    setBulkActionsDropdownOpen(false);
    startBulkTransition(async () => {
      const results = await Promise.all(
        selectedTaskIds.map((taskId) => moveTaskToList(taskId, targetListId)),
      );
      let succeeded = 0;
      results.forEach((res) => {
        if (res.success) {
          succeeded++;
          reconcileTaskMoved(res.data.movedTask, res.data.affectedTasks);
        }
      });
      const failed = results.length - succeeded;

      toast(
        failed === 0
          ? { title: `${succeeded} task${succeeded === 1 ? "" : "s"} moved` }
          : {
              title: `${succeeded} moved, ${failed} failed`,
              variant: "destructive",
            },
      );

      clearSelection();
      exitSelectionMode();
    });
  }

  function handleBulkDelete() {
    if (selectedTaskIds.length === 0) return;
    const idsToDelete = selectedTaskIds;

    const taskListMap = new Map<string, string>();
    lists.forEach((l) =>
      l.tasks.forEach((t) => {
        if (idsToDelete.includes(t.id)) taskListMap.set(t.id, l.id);
      }),
    );

    startBulkTransition(async () => {
      const results = await Promise.all(
        idsToDelete.map(async (taskId) => ({
          taskId,
          result: await deleteTask(taskId),
        })),
      );

      let succeeded = 0;
      results.forEach(({ taskId, result }) => {
        if (result.success) {
          succeeded++;
          const listId = taskListMap.get(taskId);
          if (listId) removeTask(listId, taskId);
        }
      });
      const failed = results.length - succeeded;

      toast(
        failed === 0
          ? { title: `${succeeded} task${succeeded === 1 ? "" : "s"} deleted` }
          : {
              title: `${succeeded} deleted, ${failed} failed`,
              variant: "destructive",
            },
      );

      setBulkDeleteConfirmOpen(false);
      clearSelection();
      exitSelectionMode();
    });
  }

  const allMembersList = [
    {
      id: project.ownerId,
      userId: project.ownerId,
      name: ownerName || "Project Owner",
      email: ownerEmail,
      imageUrl: ownerImageUrl,
      hasImage: ownerHasImage,
      role: "owner" as const,
    },
    ...membersState.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      imageUrl: m.imageUrl,
      hasImage: m.hasImage,
      role: m.role,
    })),
  ];

  const visibleMembers = allMembersList.slice(0, 3);
  const extraCount = allMembersList.length > 3 ? allMembersList.length - 3 : 0;

  const openArchiveModal = useUiStore((s) => s.openArchiveModal);
  const archiveModalOpen = useUiStore((s) => s.archiveModalOpen);
  const closeArchiveModal = useUiStore((s) => s.closeArchiveModal);

  const allProjectUsers = [
    {
      userId: project.ownerId,
      name: ownerName || "Project Owner",
      email: ownerEmail,
    },
    ...membersState.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
    })),
  ];

  const [liveProject, setLiveProject] = useState(project);
  useEffect(() => {
    setLiveProject(project);
  }, [project]);

  const handleProjectEvent = useCallback(
    (event: ProjectRealtimeEvent) => {
      if (event.type === "project_updated") {
        setLiveProject(event.project);
      } else if (event.type === "member_added") {
        addMember(project.id, {
          id: event.member.memberId,
          userId: event.member.userId,
          email: event.member.email,
          name: event.member.name,
          role: event.member.role as any,
        });
      } else if (event.type === "member_removed") {
        removeMember(project.id, event.memberId);
      }
    },
    [project.id, addMember, removeMember],
  );
  useRealtimeProject(project.id, handleProjectEvent);

  const formattedRoleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="flex flex-col gap-3 bg-card/70 backdrop-blur-md p-4 sm:p-5 border border-border/80 rounded-3xl shadow-xs m-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left side: Back button + Title + Role Badge */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <Link
            href="/projects"
            className="p-2 hover:bg-secondary rounded-2xl transition-all text-muted-foreground shrink-0 border border-border/60"
            aria-label="Back to projects"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center space-x-3 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate tracking-tight">
              {liveProject.name}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/60 tracking-wide shrink-0">
              {formattedRoleLabel}
            </span>
          </div>
        </div>

        {/* Right side controls & Streamlined Actions */}
        <div className="flex items-center space-x-2.5 ml-auto flex-wrap">
          {/* Search input */}
          <div className="relative w-52 sm:w-60 md:w-64 hidden sm:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={13}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background border-border rounded-xl shadow-2xs focus-visible:ring-1 w-full text-foreground"
              placeholder="Search tasks..."
            />
          </div>

          {selectionMode ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-muted-foreground px-1 whitespace-nowrap">
                {selectedTaskIds.length} selected
              </span>

              {/* Bulk Actions Dropdown */}
              <DropdownMenu
                open={bulkActionsDropdownOpen}
                onOpenChange={setBulkActionsDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedTaskIds.length === 0 || isBulkPending}
                    className="h-9 text-xs bg-background border-border text-foreground rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-secondary"
                  >
                    <span>Actions</span>
                    <ChevronDown size={13} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 text-left z-50"
                >
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                    <span>Selected Options</span>
                    <button
                      onClick={() => setBulkActionsDropdownOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Move To List selection */}
                  <div className="px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Move to list
                    </span>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                      {lists.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => handleBulkMove(l.id)}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary rounded-xl flex items-center space-x-2 transition-colors"
                        >
                          <FolderInput
                            size={13}
                            className="text-muted-foreground"
                          />
                          <span className="truncate">{l.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-border my-1" />

                  <DropdownMenuItem
                    onSelect={() => {
                      setBulkActionsDropdownOpen(false);
                      setBulkDeleteConfirmOpen(true);
                    }}
                    className="cursor-pointer px-2.5 py-2 text-xs text-destructive focus:bg-destructive/10 rounded-xl flex items-center space-x-2"
                  >
                    <Trash2 size={13} className="text-destructive" />
                    <span>Delete selected</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSelection();
                  exitSelectionMode();
                }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              {/* Filter Button */}
              <DropdownMenu
                open={filterDropdownOpen}
                onOpenChange={setFilterDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-9 text-xs bg-background border-border text-foreground rounded-xl shadow-2xs px-3 flex items-center gap-1.5 hover:bg-secondary"
                  >
                    <Filter size={13} className="text-muted-foreground" />
                    <span>Filter</span>
                    {isFilterActive && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-card" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-card border border-border rounded-2xl shadow-xl p-3.5 space-y-3.5 text-left z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">
                      Filters
                    </span>
                    <button
                      onClick={() => setFilterDropdownOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </label>
                    <Select
                      value={filterCompleted}
                      onValueChange={(val: any) => setFilterCompleted(val)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-card border border-border rounded-xl">
                        <SelectItem value="all" className="text-xs">
                          All
                        </SelectItem>
                        <SelectItem value="completed" className="text-xs">
                          Completed
                        </SelectItem>
                        <SelectItem value="incomplete" className="text-xs">
                          Incomplete
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Priority
                    </label>
                    <Select
                      value={filterPriority}
                      onValueChange={(val: any) => setFilterPriority(val)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-card border border-border rounded-xl">
                        <SelectItem value="all" className="text-xs">
                          All
                        </SelectItem>
                        <SelectItem value="low" className="text-xs">
                          Low
                        </SelectItem>
                        <SelectItem value="medium" className="text-xs">
                          Medium
                        </SelectItem>
                        <SelectItem value="high" className="text-xs">
                          High
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Due date
                    </label>
                    <Select
                      value={filterDueDate}
                      onValueChange={(val: any) => setFilterDueDate(val)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
                        <SelectValue placeholder="All due dates" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-card border border-border rounded-xl">
                        <SelectItem value="all" className="text-xs">
                          All
                        </SelectItem>
                        <SelectItem value="overdue" className="text-xs">
                          Overdue
                        </SelectItem>
                        <SelectItem value="today" className="text-xs">
                          Due today
                        </SelectItem>
                        <SelectItem value="this_week" className="text-xs">
                          Due this week
                        </SelectItem>
                        <SelectItem value="none" className="text-xs">
                          No due date
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Assignee
                    </label>
                    <Select
                      value={filterAssigneeId ?? "all"}
                      onValueChange={(val) =>
                        setFilterAssigneeId(val === "all" ? null : val)
                      }
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
                        <SelectValue placeholder="Any assignee" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-card border border-border rounded-xl">
                        <SelectItem value="all" className="text-xs">
                          Any assignee
                        </SelectItem>
                        {allProjectUsers.map((user) => (
                          <SelectItem
                            key={user.userId}
                            value={user.userId}
                            className="text-xs"
                          >
                            {user.name || user.email || "User"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label
                      htmlFor="assigned-to-me"
                      className="text-xs text-foreground cursor-pointer font-medium"
                    >
                      Assigned to me
                    </label>
                    <input
                      id="assigned-to-me"
                      type="checkbox"
                      checked={filterAssignedToMe}
                      onChange={(e) => setFilterAssignedToMe(e.target.checked)}
                      className="rounded border-border text-teal-600 focus:ring-ring h-4 w-4 bg-background"
                    />
                  </div>

                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearAllFilters()}
                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                    >
                      Clear all filters
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Selection Mode Button */}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterSelectionMode}
                  className="h-9 text-xs bg-background border-border text-foreground rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-secondary"
                >
                  <ListChecks size={13} className="text-muted-foreground" />
                  <span>Select</span>
                </Button>
              )}

              {/* Consolidated More Actions Menu */}
              <DropdownMenu
                open={actionsDropdownOpen}
                onOpenChange={setActionsDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-xs bg-background border-border text-foreground rounded-xl shadow-2xs hover:bg-secondary"
                    aria-label="Project actions"
                  >
                    <MoreVertical size={16} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 text-left z-50"
                >
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                    <span>Project Options</span>
                    <button
                      onClick={() => setActionsDropdownOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <DropdownMenuItem
                    onSelect={() => {
                      setActionsDropdownOpen(false);
                      setCalendarModalOpen(true);
                    }}
                    className="cursor-pointer px-2.5 py-2 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center space-x-2.5"
                  >
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>Project Calendar</span>
                  </DropdownMenuItem>

                  <Link href={`/projects/${project.id}/team`} className="block">
                    <DropdownMenuItem className="cursor-pointer px-2.5 py-2 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center space-x-2.5">
                      <Users2 size={14} className="text-muted-foreground" />
                      <span>Team Access</span>
                    </DropdownMenuItem>
                  </Link>

                  <DropdownMenuSeparator className="bg-border my-1" />

                  {canManage && (
                    <DropdownMenuItem
                      onSelect={() => {
                        setActionsDropdownOpen(false);
                        setInviteOpen(true);
                      }}
                      className="cursor-pointer px-2.5 py-2 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center space-x-2.5"
                    >
                      <UserPlus size={14} className="text-muted-foreground" />
                      <span>Add members</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={() => {
                      setActionsDropdownOpen(false);
                      openArchiveModal();
                    }}
                    className="cursor-pointer px-2.5 py-2 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center space-x-2.5"
                  >
                    <Archive size={14} className="text-muted-foreground" />
                    <span>Archived tasks</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Team Members Avatars */}
          <div className="hidden sm:flex items-center pl-2.5 border-l border-border ml-1">
            <div className="flex -space-x-1.5">
              {visibleMembers.map((m) => {
                const roleLabel =
                  m.role === "owner"
                    ? "Owner"
                    : m.role === "editor"
                      ? "Editor"
                      : "Viewer";

                const displayName = m.name || m.email || "User";

                return (
                  <DropdownMenu key={m.id}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        title={`${displayName} (${m.role})`}
                      >
                        <UserAvatar
                          userId={m.userId || m.email || m.id}
                          name={displayName}
                          imageUrl={m.imageUrl}
                          hasImage={m.hasImage ?? false}
                          className="w-7 h-7"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-72 bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center space-x-3 z-50"
                    >
                      <UserAvatar
                        userId={m.userId || m.email || m.id}
                        name={displayName}
                        imageUrl={m.imageUrl}
                        hasImage={m.hasImage ?? false}
                        className="w-12 h-12 text-base shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {displayName}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {m.email}
                        </span>
                        <span className="text-xs font-medium text-foreground mt-0.5">
                          {roleLabel}
                        </span>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>

            {extraCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-6 px-2 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold border border-border">
                +{extraCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <InviteMemberModal
          project={project}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onMemberAdded={addMember}
          onMemberAddConfirmed={replaceOptimisticMember}
          onMemberRemoved={removeMember}
        />
      )}

      <ArchivedTasksModal
        projectId={project.id}
        open={archiveModalOpen}
        onOpenChange={(open) =>
          open ? openArchiveModal() : closeArchiveModal()
        }
        role={role}
      />

      <DeleteTaskDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        taskTitle={`${selectedTaskIds.length} selected task${
          selectedTaskIds.length === 1 ? "" : "s"
        }`}
        isPending={isBulkPending}
      />

      <ProjectCalendarModal
        projectId={project.id}
        projectName={liveProject.name}
        upcomingTasks={upcomingTasks}
        currentUserId={currentUserId}
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
      />
    </div>
  );
}
