"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask } from "@/lib/actions/tasks";
import type { Task } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type CreateTaskModalProps = {
  listId: string;
  onCreated?: () => void;
  task?: Task;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function CreateTaskModal({
  listId,
  onCreated,
  task,
}: CreateTaskModalProps) {
  const isEdit = Boolean(task);
  const { toast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [genericError, setGenericError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setGenericError(undefined);
    startTransition(async () => {
      const input = {
        title,
        listId,
      };

      const result = isEdit
        ? await updateTask(task!.id, { title })
        : await createTask(input);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          toast({
            title: isEdit ? "Failed to update task" : "Failed to create task",
            description: "Please check the highlighted fields.",
            variant: "destructive",
          });
        } else {
          setGenericError(result.error);
          toast({
            title: isEdit ? "Failed to update task" : "Failed to create task",
            description: result.error,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: isEdit ? "Task updated" : "Task created",
        description: title,
      });

      setTitle("");
      setFieldErrors(undefined);
      setIsExpanded(false);
      onCreated?.();
    });
  }

  if (!isExpanded && !isEdit) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center space-x-2 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-3 font-medium transition-colors text-sm shadow-sm border border-neutral-200 dark:border-neutral-700"
      >
        <Plus size={16} />
        <span>Add a task</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 rounded-lg p-3 space-y-3 border border-neutral-200 dark:border-neutral-700 shadow-sm"
    >
      {genericError && (
        <p className="text-destructive text-xs">{genericError}</p>
      )}
      <div className="space-y-1">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title"
          className="bg-white dark:bg-neutral-900 h-9 text-sm border border-neutral-200 dark:border-neutral-700 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
        />
        {fieldErrors?.title && (
          <p className="text-destructive text-xs">{fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !title.trim()}
          className="bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium"
        >
          {isPending
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
              ? "Save"
              : "Add task"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            setTitle("");
            setFieldErrors(undefined);
            setGenericError(undefined);
          }}
          className="bg-white dark:bg-neutral-900"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
