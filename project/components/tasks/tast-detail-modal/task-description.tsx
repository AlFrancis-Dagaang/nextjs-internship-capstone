"use client";

import { useState, useTransition } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  AtSign,
  Smile,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import { useBoardStore } from "@/stores/board-store";

export function TaskDescription({
  task,
  onChanged,
}: {
  task: Task;
  onChanged?: (task: Task) => void;
}) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description ?? "");
  const [isPending, startTransition] = useTransition();
  const updateTaskLocal = useBoardStore((s) => s.updateTaskLocal);

  function handleSave() {
    const submittedDescription = description;
    setIsEditing(false);
    updateTaskLocal({ ...task, description: submittedDescription || null });

    startTransition(async () => {
      const result = await updateTask(task.id, {
        description: submittedDescription || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update description",
          description: result.error,
          variant: "destructive",
        });
        updateTaskLocal(task); // revert the board card
        setIsEditing(true); // reopen so the failed edit isn't silently lost
        return;
      }

      onChanged?.(result.data);
    });
  }

  function handleCancel() {
    setDescription(task.description ?? "");
    setIsEditing(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <span className="text-neutral-500">≡</span> Description
        </h3>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 text-xs shadow-none"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950 focus-within:ring-1 focus-within:ring-cyan-400">
          {/* Formatting Toolbar */}
          <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <Bold size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <Italic size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <Strikethrough size={14} />
            </Button>

            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <LinkIcon size={14} />
            </Button>

            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <List size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <ListOrdered size={14} />
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <AtSign size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              type="button"
            >
              <Smile size={14} />
            </Button>
          </div>

          {/* Fixed size textarea with vertical scroll support */}
          <Textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            className="h-32 max-h-48 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-y shadow-none text-sm bg-white dark:bg-neutral-950 px-3 py-2 overflow-y-auto"
          />

          <div className="p-2 flex justify-end gap-2 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancel}
              disabled={isPending}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium"
              onClick={handleSave}
              disabled={isPending}
              type="button"
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        /* Fixed view box with internal scrolling when text is long */
        <div
          onClick={() => setIsEditing(true)}
          className="min-h-25 max-h-40 overflow-y-auto p-3 rounded-md bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-colors whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 pr-2"
        >
          {task.description ? (
            task.description
          ) : (
            <span className="text-neutral-400 italic">
              Add a more detailed description...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
