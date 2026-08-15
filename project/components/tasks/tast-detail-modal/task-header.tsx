"use client";

import { useState, useTransition } from "react";
import { updateTask, toggleTaskComplete } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import { useBoardStore } from "@/stores/board-store";
import { Check } from "lucide-react";

type TaskHeaderProps = {
  task: Task;
  canEdit: boolean;
  onChanged?: (task: Task) => void;
};

export function TaskHeader({ task, canEdit, onChanged }: TaskHeaderProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(task.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTogglingComplete, startCompleteTransition] = useTransition();

  const toggleTaskCompleteLocally = useBoardStore(
    (s) => s.toggleTaskCompleteLocally,
  );
  const revertTaskComplete = useBoardStore((s) => s.revertTaskComplete);

  function handleSave() {
    setIsEditing(false);
    if (title.trim() === task.title || title.trim() === "") {
      setTitle(task.title);
      return;
    }

    startTransition(async () => {
      const result = await updateTask(task.id, { title });
      if (!result.success) {
        toast({
          title: "Failed to update title",
          description: result.error,
          variant: "destructive",
        });
        setTitle(task.title);
        return;
      }
      onChanged?.(result.data);
    });
  }

  function handleToggleComplete() {
    const previousValue = toggleTaskCompleteLocally(task.id);

    startCompleteTransition(async () => {
      const result = await toggleTaskComplete(task.id);
      if (result.success) {
        onChanged?.(result.data);
      } else {
        revertTaskComplete(task.id, previousValue);
        toast({
          title: "Failed to update task",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1">
        <button
          type="button"
          onClick={canEdit ? handleToggleComplete : undefined}
          disabled={isTogglingComplete || !canEdit}
          aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
          className={`mt-1.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${
            task.isCompleted
              ? "bg-primary border-primary text-primary-foreground"
              : canEdit
                ? "border-input hover:border-primary cursor-pointer"
                : "border-input"
          }`}
        >
          {task.isCompleted && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="flex-1">
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              disabled={isPending}
              className="w-full bg-transparent text-xl font-bold border border-input focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground"
            />
          ) : (
            <h2
              onClick={canEdit ? () => setIsEditing(true) : undefined}
              className={`w-full bg-transparent text-xl font-bold cursor-text px-2 py-1 -ml-2 rounded hover:bg-accent transition-colors ${
                task.isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
              title={canEdit ? "Click to edit title" : undefined}
            >
              {task.title}
            </h2>
          )}
        </div>
      </div>
    </div>
  );
}
