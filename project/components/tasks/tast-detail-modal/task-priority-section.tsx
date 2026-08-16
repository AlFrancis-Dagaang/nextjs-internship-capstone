"use client";

import { useTransition, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import { useBoardStore } from "@/stores/board-store";

export function TaskPrioritySection({
  task,
  onChanged,
  canEdit,
}: {
  task: Task;
  onChanged?: (task: Task) => void;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState(task.priority ?? "");
  const updateTaskLocal = useBoardStore((s) => s.updateTaskLocal);

  useEffect(() => {
    setPriority(task.priority ?? "");
  }, [task.priority]);

  function handlePriorityChange(newPriority: string) {
    setPriority(newPriority);
    updateTaskLocal({ ...task, priority: newPriority as Task["priority"] });

    startTransition(async () => {
      const result = await updateTask(task.id, { priority: newPriority });
      if (!result.success) {
        toast({
          title: "Failed to update priority",
          description: result.error,
          variant: "destructive",
        });
        setPriority(task.priority ?? "");
        updateTaskLocal(task);
        return;
      }
      onChanged?.(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
        Priority
      </Label>
      <Select
        value={priority}
        onValueChange={handlePriorityChange}
        disabled={isPending || !canEdit}
      >
        <SelectTrigger className="w-full bg-card border-input h-9 text-xs focus:ring-1 focus:ring-ring text-card-foreground">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border text-popover-foreground shadow-xl rounded-xl z-50">
          <SelectItem
            value="low"
            className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
          >
            Low
          </SelectItem>
          <SelectItem
            value="medium"
            className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
          >
            Medium
          </SelectItem>
          <SelectItem
            value="high"
            className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
          >
            High
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
