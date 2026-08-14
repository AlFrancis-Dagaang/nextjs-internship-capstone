"use client";

import { useTransition, useState, useEffect } from "react";
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
  canEdit,
}: {
  task: Task;
  onChanged?: (task: Task) => void;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const updateTaskLocal = useBoardStore((s) => s.updateTaskLocal);
  useEffect(() => {
    setDueDate(toDateInputValue(task.dueDate));
  }, [task.dueDate]);
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

  // Completed always wins over overdue — a completed task past its due
  // date is not "overdue," it's just done late. Mutually exclusive.
  const isOverdue =
    !task.isCompleted &&
    task.dueDate != null &&
    new Date(task.dueDate) < new Date();

  const statusLabel = task.isCompleted
    ? {
        text: "Completed",
        className:
          "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
      }
    : isOverdue
      ? {
          text: "Overdue",
          className:
            "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
        }
      : null;

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
          disabled={isPending || !canEdit}
          className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-9 text-sm focus-visible:ring-1 focus-visible:ring-cyan-400"
        />
        {statusLabel && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusLabel.className}`}
          >
            {statusLabel.text}
          </span>
        )}
      </div>
    </div>
  );
}
