"use client";

import { useState, useEffect, useRef, useTransition } from "react";
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
import { useProjectStore } from "@/stores/project-store";
import { useUiStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { ArchivedTasksModal } from "../tasks/modal/archived-tasks-modal";
import { DeleteTaskDialog } from "@/components/tasks/modal/delete-task-dialog";
import { moveTaskToList, deleteTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "editor" | "viewer";
};

export function ProjectHeader({
  project,
  initialMembers,
  isOwner,
  ownerName,
  ownerEmail,
  role,
}: {
  project: Project;
  initialMembers: Member[];
  isOwner: boolean;
  ownerName?: string;
  ownerEmail?: string;
  role: "owner" | "editor" | "viewer";
}) {
  const { toast } = useToast();
  const canEdit = role !== "viewer";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [bulkActionsDropdownOpen, setBulkActionsDropdownOpen] = useState(false);
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);

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

  const avatarColors = [
    "bg-blue-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-teal-600",
    "bg-rose-600",
  ];

  const visibleMembers = membersState.slice(0, 3);
  const extraCount = membersState.length > 3 ? membersState.length - 3 : 0;

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

  return (
    <div className="flex flex-col gap-2 bg-transparent px-0 py-0 m-0">
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        {/* Left side: Back button + Title & Avatars */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <Link
            href="/projects"
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-lg transition-all text-neutral-500 dark:text-neutral-400 shrink-0 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            aria-label="Back to projects"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center space-x-3 min-w-0">
            <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate tracking-tight">
              {project.name}
            </h1>

            <div className="hidden sm:flex items-center">
              <div className="flex -space-x-1.5 overflow-hidden">
                <div
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-amber-500 text-white flex items-center justify-center text-[9px] font-semibold uppercase shadow-sm leading-none text-center"
                  title={`Owner: ${ownerName || ownerEmail || "Project Owner"}`}
                >
                  {ownerName?.[0] ?? ownerEmail?.[0] ?? "U"}
                </div>
                {visibleMembers.map((m, i) => (
                  <div
                    key={m.id}
                    className={`inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 text-white flex items-center justify-center text-[9px] font-semibold uppercase shadow-sm leading-none text-center ${
                      avatarColors[i % avatarColors.length]
                    }`}
                    title={`${m.name ?? m.email ?? "Member"} (${m.role})`}
                  >
                    {m.name?.[0] ?? m.email?.[0] ?? "U"}
                  </div>
                ))}
              </div>
              {extraCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-medium border border-neutral-200/60 dark:border-neutral-700/60 leading-none">
                  +{extraCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3 ml-auto flex-wrap">
          <div className="relative w-64 sm:w-80 md:w-96 hidden sm:block">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
              size={13}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-cyan-500 w-full"
              placeholder="Search tasks..."
            />
          </div>

          {selectionMode ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 px-1 whitespace-nowrap">
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
                    className="h-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span>Actions</span>
                    <ChevronDown size={13} className="text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-left z-50"
                >
                  <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                    <span>Selected Options</span>
                    <button
                      onClick={() => setBulkActionsDropdownOpen(false)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Move To Sub-dropdown/List selection */}
                  <div className="px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      Move to list
                    </span>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                      {lists.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => handleBulkMove(l.id)}
                          className="w-full text-left px-2 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <FolderInput size={13} className="text-neutral-400" />
                          <span className="truncate">{l.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800 my-1" />

                  <DropdownMenuItem
                    onSelect={() => {
                      setBulkActionsDropdownOpen(false);
                      setBulkDeleteConfirmOpen(true);
                    }}
                    className="cursor-pointer px-2.5 py-2 text-xs text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-lg flex items-center space-x-2.5"
                  >
                    <Trash2 size={14} className="text-red-500" />
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
                className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <DropdownMenu
                open={filterDropdownOpen}
                onOpenChange={setFilterDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm px-2.5 flex items-center gap-1.5"
                  >
                    <Filter size={13} className="text-neutral-500" />
                    <span>Filter</span>
                    {isFilterActive && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-neutral-900" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-3 space-y-3 text-left z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Filters
                    </span>
                    <button
                      onClick={() => setFilterDropdownOpen(false)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Status
                    </label>
                    <Select
                      value={filterCompleted}
                      onValueChange={(val: any) => setFilterCompleted(val)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-neutral-50/50 dark:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700 rounded-lg shadow-none">
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
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
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Priority
                    </label>
                    <Select
                      value={filterPriority}
                      onValueChange={(val: any) => setFilterPriority(val)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-neutral-50/50 dark:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700 rounded-lg shadow-none">
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
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
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Due date
                    </label>
                    <Select
                      value={filterDueDate}
                      onValueChange={(val: any) => setFilterDueDate(val)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-neutral-50/50 dark:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700 rounded-lg shadow-none">
                        <SelectValue placeholder="All due dates" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
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
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Assignee
                    </label>
                    <Select
                      value={filterAssigneeId ?? "all"}
                      onValueChange={(val) =>
                        setFilterAssigneeId(val === "all" ? null : val)
                      }
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-neutral-50/50 dark:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700 rounded-lg shadow-none">
                        <SelectValue placeholder="Any assignee" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
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
                      className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer"
                    >
                      Assigned to me
                    </label>
                    <input
                      id="assigned-to-me"
                      type="checkbox"
                      checked={filterAssignedToMe}
                      onChange={(e) => setFilterAssignedToMe(e.target.checked)}
                      className="rounded border-neutral-300 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                    />
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearAllFilters()}
                      className="w-full h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      Clear all filters
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterSelectionMode}
                  className="h-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <ListChecks size={13} className="text-neutral-500" />
                  <span>Select</span>
                </Button>
              )}

              <DropdownMenu
                open={actionsDropdownOpen}
                onOpenChange={setActionsDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm"
                    aria-label="Project actions"
                  >
                    <MoreVertical size={16} className="text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-left z-50"
                >
                  <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                    <span>Actions</span>
                    <button
                      onClick={() => setActionsDropdownOpen(false)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {isOwner && (
                    <DropdownMenuItem
                      onSelect={() => {
                        setActionsDropdownOpen(false);
                        setInviteOpen(true);
                      }}
                      className="cursor-pointer px-2.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                    >
                      <UserPlus size={14} className="text-neutral-400" />
                      <span>Add members</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={() => {
                      setActionsDropdownOpen(false);
                      openArchiveModal();
                    }}
                    className="cursor-pointer px-2.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                  >
                    <Archive size={14} className="text-neutral-400" />
                    <span>Archived tasks</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {isOwner && (
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
    </div>
  );
}
