"use client";

import { useState, useTransition, useEffect } from "react";
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
  canEdit,
  onMoved,
}: {
  task: Task;
  allLists: ListWithTasks[];
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  canEdit: boolean;
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

  useEffect(() => {
    setTargetListId(task.listId);
    setPosition(
      currentIndexInCurrentList >= 0
        ? String(currentIndexInCurrentList + 1)
        : "1",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.listId, currentIndexInCurrentList]);

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
      <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
        Move the task
      </Label>

      <div className="flex gap-2">
        <div className="space-y-1 flex-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">
            List
          </label>
          <Select
            value={targetListId}
            onValueChange={setTargetListId}
            disabled={isMoving || !canEdit}
          >
            <SelectTrigger className="w-full h-8 text-xs bg-card border-input text-card-foreground focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="Select list" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-popover-foreground shadow-xl rounded-xl z-50">
              {allLists.map((list) => (
                <SelectItem
                  key={list.id}
                  value={list.id}
                  className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 w-20">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">
            Position
          </label>
          <Select
            value={position}
            onValueChange={setPosition}
            disabled={isMoving || !canEdit}
          >
            <SelectTrigger className="w-full h-8 text-xs bg-card border-input text-card-foreground focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="1" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-popover-foreground shadow-xl rounded-xl z-50">
              {positionOptions.map((p) => (
                <SelectItem
                  key={p}
                  value={p}
                  className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasChanges && canEdit && (
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-8 text-xs shadow-none mt-2"
          disabled={isMoving}
          onClick={handleMove}
        >
          {isMoving ? "Moving..." : "Confirm Move"}
        </Button>
      )}
    </div>
  );
}
