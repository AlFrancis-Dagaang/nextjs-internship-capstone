"use client";

import { useState, useEffect, useTransition } from "react";
import {
  MoreHorizontal,
  ChevronLeft,
  X,
  ExternalLink,
  Edit2,
  Archive,
  Move,
  Trash2,
  UserPlus,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import { moveTaskToList, archiveTask } from "@/lib/actions/tasks";
import {
  getTaskAssignees,
  assignUserToTask,
} from "@/lib/actions/task-assignees";
import { getAssignableUsers } from "@/lib/actions/project-member";
import { ListWithTasks } from "@/components/lists/board";
import { useBoardStore } from "@/stores/board-store";

type AssigneeUser = {
  id: string;
  name?: string;
  email?: string;
};

export function TaskActions({
  taskId,
  projectId,
  currentListId,
  allLists,
  canEdit,
  onAssigned,
  onView,
  onRename,
  onArchive,
  onDeleteClick,
  onMoved,
}: {
  taskId: string;
  projectId: string;
  currentListId: string;
  allLists: ListWithTasks[];
  canEdit: boolean;
  onView: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDeleteClick: () => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  onAssigned?: (assignee: {
    userId: string;
    name?: string;
    email?: string;
  }) => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "move" | "assign">("menu");
  const [targetListId, setTargetListId] = useState(currentListId);
  const [position, setPosition] = useState("1");
  const [isMoving, startMoveTransition] = useTransition();

  // Assign panel state
  const [assignableUsers, setAssignableUsers] = useState<AssigneeUser[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [, startAssignTransition] = useTransition();

  const applyOptimisticMove = useBoardStore((s) => s.applyOptimisticMove);
  const revertMoveSnapshot = useBoardStore((s) => s.revertMoveSnapshot);
  const archiveTaskLocally = useBoardStore((s) => s.archiveTaskLocally);
  const revertArchiveSnapshot = useBoardStore((s) => s.revertArchiveSnapshot);

  // Reset target/position defaults whenever the move panel opens
  useEffect(() => {
    if (view === "move") {
      setTargetListId(currentListId);

      const currentList = allLists.find((l) => l.id === currentListId);
      const sortedTasks = currentList
        ? [...currentList.tasks].sort((a, b) => a.position - b.position)
        : [];
      const currentIndex = sortedTasks.findIndex((t) => t.id === taskId);

      setPosition(currentIndex >= 0 ? String(currentIndex + 1) : "1");
    }
  }, [view, currentListId, allLists, taskId]);

  // Fetch assignees and assignable users when the assign panel opens
  useEffect(() => {
    if (view === "assign") {
      setAssignSearchQuery("");
      setIsLoadingAssignees(true);

      async function loadAssignData() {
        try {
          const [assigneesRes, candidatesRes] = await Promise.all([
            getTaskAssignees(taskId),
            getAssignableUsers(projectId),
          ]);

          if (assigneesRes.success) {
            setAssignedUserIds(new Set(assigneesRes.data.map((a) => a.userId)));
          }
          if (candidatesRes.success) {
            setAssignableUsers(candidatesRes.data);
          }
        } catch (err) {
          console.error("Failed to load assignee options:", err);
        } finally {
          setIsLoadingAssignees(false);
        }
      }

      loadAssignData();
    }
  }, [view, taskId, projectId]);

  // Derive destination task count from props — no fetch needed
  const destTaskCount = (() => {
    const destList = allLists.find((l) => l.id === targetListId);
    if (!destList) return 0;
    return targetListId === currentListId
      ? destList.tasks.filter((t) => t.id !== taskId).length
      : destList.tasks.length;
  })();

  function handleMove() {
    const zeroIndexedPosition = parseInt(position, 10) - 1;
    const snapshot = applyOptimisticMove(
      taskId,
      targetListId,
      zeroIndexedPosition,
    );
    setIsOpen(false);
    setView("menu");

    startMoveTransition(async () => {
      const result = await moveTaskToList(
        taskId,
        targetListId,
        zeroIndexedPosition,
      );
      if (!result.success) {
        revertMoveSnapshot(snapshot);
        toast({
          title: "Failed to move task",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Task moved" });
      onMoved?.(result.data.movedTask, result.data.affectedTasks);
    });
  }

  function handleQuickAssign(user: AssigneeUser) {
    if (assignedUserIds.has(user.id)) return;

    startAssignTransition(async () => {
      const result = await assignUserToTask(taskId, user.id);
      if (!result.success) {
        toast({
          title: "Failed to assign user",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setAssignedUserIds((prev) => new Set(prev).add(user.id));
      onAssigned?.({ userId: user.id, name: user.name, email: user.email });
      toast({
        title: "Member assigned",
        description: "Successfully added member to task.",
      });
    });
  }

  const filteredAssignableUsers = assignableUsers.filter((u) => {
    const q = assignSearchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = u.email?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch;
  });

  const positionOptions = Array.from({ length: destTaskCount + 1 }, (_, i) =>
    String(i + 1),
  );

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setTimeout(() => setView("menu"), 150);
        }
      }}
    >
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
        className="w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-2 space-y-1 text-left z-9999"
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
            <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 mb-1">
              <span>Task</span>
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
                onView();
              }}
              className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
            >
              <ExternalLink size={15} className="text-neutral-400" />
              <span>View task</span>
            </DropdownMenuItem>

            {canEdit && (
              <div className="pt-1.5 pb-1 border-t border-neutral-100 dark:border-neutral-800 mt-1">
                <div className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Management
                </div>
                <DropdownMenuItem
                  onSelect={() => {
                    setIsOpen(false);
                    onRename();
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                >
                  <Edit2 size={15} className="text-neutral-400" />
                  <span>Rename task</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={async () => {
                    setIsOpen(false);
                    const snapshot = archiveTaskLocally(taskId);
                    const result = await archiveTask(taskId);
                    if (result.success) {
                      toast({
                        title: "Task archived",
                        description: "Task has been successfully archived.",
                      });
                      onArchive();
                    } else {
                      revertArchiveSnapshot(snapshot);
                      toast({
                        title: "Failed to archive task",
                        description: result.error,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                >
                  <Archive size={15} className="text-neutral-400" />
                  <span>Archive task</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setView("assign");
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                >
                  <UserPlus size={15} className="text-neutral-400" />
                  <span>Assign member</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setView("move");
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
                >
                  <Move size={15} className="text-neutral-400" />
                  <span>Move task</span>
                </DropdownMenuItem>
              </div>
            )}
            {canEdit && (
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-1">
                <DropdownMenuItem
                  onSelect={() => {
                    setIsOpen(false);
                    onDeleteClick();
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg flex items-center space-x-2.5"
                >
                  <Trash2 size={15} className="text-red-500" />
                  <span>Remove task</span>
                </DropdownMenuItem>
              </div>
            )}
          </>
        ) : view === "move" ? (
          <div className="p-1 space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setView("menu")}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Move task
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-2 space-y-2.5 pt-1">
              <div className="flex gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-medium text-neutral-500 uppercase">
                    List
                  </label>
                  <Select value={targetListId} onValueChange={setTargetListId}>
                    <SelectTrigger className="w-full h-8 text-xs border-0 bg-neutral-100 dark:bg-neutral-800 shadow-none focus:ring-0">
                      <SelectValue placeholder="Select list" />
                    </SelectTrigger>
                    <SelectContent className="z-99999">
                      {allLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-20">
                  <label className="text-[10px] font-medium text-neutral-500 uppercase">
                    Position
                  </label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="w-full h-8 text-xs border-0 bg-neutral-100 dark:bg-neutral-800 shadow-none focus:ring-0">
                      <SelectValue placeholder="1" />
                    </SelectTrigger>
                    <SelectContent className="z-99999">
                      {positionOptions.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="px-2 pt-2 pb-1">
              <Button
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium h-8 text-xs shadow-none"
                disabled={isMoving}
                onClick={handleMove}
              >
                {isMoving ? "Moving..." : "Move"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-1 space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setView("menu")}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Assign member
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-2 space-y-2.5 pt-1">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={13}
                />
                <Input
                  placeholder="Search members..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg shadow-none focus-visible:ring-1"
                />
              </div>

              <div className="max-h-44 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-lg">
                {isLoadingAssignees ? (
                  <div className="flex items-center justify-center py-6 text-xs text-neutral-400 gap-2">
                    <Loader2 size={14} className="animate-spin text-cyan-500" />
                    <span>Loading members...</span>
                  </div>
                ) : filteredAssignableUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    No matching members found
                  </div>
                ) : (
                  filteredAssignableUsers.map((user) => {
                    const isAlreadyAssigned = assignedUserIds.has(user.id);
                    const initials = user.name?.[0] ?? user.email?.[0] ?? "U";

                    return (
                      <div
                        key={user.id}
                        onClick={() =>
                          !isAlreadyAssigned && handleQuickAssign(user)
                        }
                        className={`px-2.5 py-2 flex items-center justify-between transition-colors ${
                          isAlreadyAssigned
                            ? "opacity-50 cursor-default"
                            : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[9px] font-medium uppercase shrink-0">
                            {initials}
                          </div>
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {user.name ?? user.email}
                          </span>
                        </div>
                        {isAlreadyAssigned && (
                          <Check size={13} className="text-cyan-500 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
