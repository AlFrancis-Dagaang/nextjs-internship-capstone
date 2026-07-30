"use client";

import { useTransition, useState } from "react";
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

export function TaskPrioritySection({
  task,
  onChanged,
}: {
  task: Task;
  onChanged?: (task: Task) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState(task.priority ?? "");

  function handlePriorityChange(newPriority: string) {
    setPriority(newPriority);

    startTransition(async () => {
      const result = await updateTask(task.id, { priority: newPriority });
      if (!result.success) {
        toast({
          title: "Failed to update priority",
          description: result.error,
          variant: "destructive",
        });
        setPriority(task.priority ?? "");
        return;
      }
      onChanged?.(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Priority
      </Label>
      <Select
        value={priority}
        onValueChange={handlePriorityChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-9 text-xs focus:ring-1 focus:ring-cyan-400">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl rounded-xl z-50">
          <SelectItem
            value="low"
            className="focus:bg-neutral-100 dark:focus:bg-neutral-800 cursor-pointer"
          >
            Low
          </SelectItem>
          <SelectItem
            value="medium"
            className="focus:bg-neutral-100 dark:focus:bg-neutral-800 cursor-pointer"
          >
            Medium
          </SelectItem>
          <SelectItem
            value="high"
            className="focus:bg-neutral-100 dark:focus:bg-neutral-800 cursor-pointer"
          >
            High
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
