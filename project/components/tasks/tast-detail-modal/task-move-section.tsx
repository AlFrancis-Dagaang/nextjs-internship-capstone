"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { moveTaskToList } from "@/lib/actions/tasks";
import type { Task } from "@/lib/db/schema";
import type { ListWithTasks } from "@/components/lists/board";
import { useBoardStore } from "@/stores/board-store";
export function TaskMoveSection({
  task,
  allLists,
  onMoved,
}: {
  task: Task;
  allLists: ListWithTasks[];
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
}) {
  const { toast } = useToast();
  const [isMoving, startMoveTransition] = useTransition();
  const applyOptimisticMove = useBoardStore((s) => s.applyOptimisticMove);
  const revertMoveSnapshot = useBoardStore((s) => s.revertMoveSnapshot);

  const currentIndexInCurrentList = (() => {
    const currentList = allLists.find((l) => l.id === task.listId);
    if (!currentList) return -1;
    const sorted = [...currentList.tasks].sort(
      (a, b) => a.position - b.position,
    );
    return sorted.findIndex((t) => t.id === task.id);
  })();

  const [targetListId, setTargetListId] = useState(task.listId);
  const [position, setPosition] = useState(
    currentIndexInCurrentList >= 0
      ? String(currentIndexInCurrentList + 1)
      : "1",
  );

  const destTaskCount = (() => {
    const destList = allLists.find((l) => l.id === targetListId);
    if (!destList) return 0;
    return targetListId === task.listId
      ? destList.tasks.filter((t) => t.id !== task.id).length
      : destList.tasks.length;
  })();

  const positionOptions = Array.from({ length: destTaskCount + 1 }, (_, i) =>
    String(i + 1),
  );

  function handleMove() {
    const zeroIndexedPosition = parseInt(position, 10) - 1;
    const snapshot = applyOptimisticMove(
      task.id,
      targetListId,
      zeroIndexedPosition,
    );

    startMoveTransition(async () => {
      const result = await moveTaskToList(
        task.id,
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

  const hasChanges =
    targetListId !== task.listId ||
    parseInt(position, 10) - 1 !== currentIndexInCurrentList;

  return (
    <div className="space-y-3">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Move the task
      </Label>

      <div className="flex gap-2">
        <div className="space-y-1 flex-1">
          <label className="text-[10px] font-medium text-neutral-500 uppercase">
            List
          </label>
          <Select
            value={targetListId}
            onValueChange={setTargetListId}
            disabled={isMoving}
          >
            <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-cyan-400">
              <SelectValue placeholder="Select list" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl rounded-xl z-50">
              {allLists.map((list) => (
                <SelectItem
                  key={list.id}
                  value={list.id}
                  className="focus:bg-neutral-100 dark:focus:bg-neutral-800 cursor-pointer"
                >
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
          <Select
            value={position}
            onValueChange={setPosition}
            disabled={isMoving}
          >
            <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-cyan-400">
              <SelectValue placeholder="1" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl rounded-xl z-50">
              {positionOptions.map((p) => (
                <SelectItem
                  key={p}
                  value={p}
                  className="focus:bg-neutral-100 dark:focus:bg-neutral-800 cursor-pointer"
                >
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasChanges && (
        <Button
          className="w-full bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium h-8 text-xs shadow-none mt-2"
          disabled={isMoving}
          onClick={handleMove}
        >
          {isMoving ? "Moving..." : "Confirm Move"}
        </Button>
      )}
    </div>
  );
}
