"use client";

import { useTransition, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import { useBoardStore } from "@/stores/board-store";

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

export function TaskDatesSection({
  task,
  onChanged,
}: {
  task: Task;
  onChanged?: (task: Task) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const updateTaskLocal = useBoardStore((s) => s.updateTaskLocal);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    setDueDate(newDate);
    updateTaskLocal({ ...task, dueDate: newDate ? new Date(newDate) : null });

    startTransition(async () => {
      const result = await updateTask(task.id, {
        dueDate: newDate || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update date",
          description: result.error,
          variant: "destructive",
        });
        setDueDate(toDateInputValue(task.dueDate));
        updateTaskLocal(task); // revert the board card too
        return;
      }
      onChanged?.(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Dates
      </Label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500 w-16">Due</span>
        <Input
          type="date"
          value={dueDate}
          onChange={handleDateChange}
          disabled={isPending}
          className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-9 text-sm focus-visible:ring-1 focus-visible:ring-cyan-400"
        />
      </div>
    </div>
  );
}
