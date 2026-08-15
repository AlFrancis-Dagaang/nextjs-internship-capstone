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
        updateTaskLocal(task);
        return;
      }
      onChanged?.(result.data);
    });
  }

  const isOverdue =
    !task.isCompleted &&
    task.dueDate != null &&
    new Date(task.dueDate) < new Date();

  const statusLabel = task.isCompleted
    ? {
        text: "Completed",
        className:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      }
    : isOverdue
      ? {
          text: "Overdue",
          className:
            "bg-destructive/10 text-destructive border border-destructive/20",
        }
      : null;

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
        Dates
      </Label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-16">Due</span>
        <Input
          type="date"
          value={dueDate}
          onChange={handleDateChange}
          disabled={isPending || !canEdit}
          className="bg-card border-input h-9 text-sm focus-visible:ring-1 focus-visible:ring-ring text-card-foreground"
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
