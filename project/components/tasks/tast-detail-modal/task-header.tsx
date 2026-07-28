"use client";

import { useState, useTransition } from "react";
import { updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";

type TaskHeaderProps = {
  task: Task;
  onChanged?: (task: Task) => void;
};

export function TaskHeader({ task, onChanged }: TaskHeaderProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(task.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setIsEditing(false);
    if (title.trim() === task.title || title.trim() === "") {
      setTitle(task.title); // reset if empty or unchanged
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
        setTitle(task.title); // revert on error
        return;
      }
      onChanged?.(result.data);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
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
                e.currentTarget.blur(); // Triggers save
              }
            }}
            disabled={isPending}
            className="w-full bg-transparent text-xl font-bold border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded px-2 py-1 text-neutral-900 dark:text-white"
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="w-full bg-transparent text-xl font-bold cursor-text px-2 py-1 -ml-2 text-neutral-900 dark:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            title="Click to edit title"
          >
            {task.title}
          </h2>
        )}
      </div>
    </div>
  );
}
