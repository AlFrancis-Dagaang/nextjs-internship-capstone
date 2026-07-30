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
import { useToast } from "@/hooks/use-toast";
import type { List, Task } from "@/lib/db/schema";
import { moveTaskToList } from "@/lib/actions/tasks";
import { ListWithTasks } from "@/components/lists/board";

export function TaskActions({
  taskId,
  projectId,
  currentListId,
  allLists,
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
  onView: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDeleteClick: () => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "move">("menu");
  const [targetListId, setTargetListId] = useState(currentListId);
  const [position, setPosition] = useState("1");
  const [isMoving, startMoveTransition] = useTransition();

  // Reset target/position defaults whenever the move panel opens
  useEffect(() => {
    if (view === "move") {
      setTargetListId(currentListId);

      const currentList = allLists.find((l) => l.id === currentListId);
      const sortedTasks = currentList
        ? [...currentList.tasks].sort((a, b) => a.position - b.position)
        : [];
      const currentIndex = sortedTasks.findIndex((t) => t.id === taskId);

      // Default to the task's actual current position (1-indexed).
      // Falls back to "1" if somehow not found.
      setPosition(currentIndex >= 0 ? String(currentIndex + 1) : "1");
    }
  }, [view, currentListId, allLists, taskId]);
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
    startMoveTransition(async () => {
      const result = await moveTaskToList(
        taskId,
        targetListId,
        zeroIndexedPosition,
      );
      if (!result.success) {
        toast({
          title: "Failed to move task",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Task moved" });
      setIsOpen(false);
      setView("menu");
      onMoved?.(result.data.movedTask, result.data.affectedTasks);
    });
  }

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
          // Radix <Select> portals its content outside this menu's own
          // content — without this, picking a list/position registers as
          // an "interact outside" and closes the whole dropdown before
          // Move can be pressed (same root cause as the ListActions bug).
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
                onSelect={() => {
                  setIsOpen(false);
                  onArchive();
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 dark:focus:bg-neutral-800 rounded-lg flex items-center space-x-2.5"
              >
                <Archive size={15} className="text-neutral-400" />
                <span>Archive task</span>
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
          </>
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
