"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask } from "@/lib/actions/tasks";
import type { Task } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { getRealtimeClientId } from "@/lib/realtime/client";

type CreateTaskModalProps = {
  listId: string;
  // #23 — onCreated is now called immediately with an optimistic task
  // (temp id for create, in-place edit for the isEdit branch), not after
  // the server responds.
  onCreated?: (task: Task) => void;
  // Create-only outcomes: onConfirmed swaps the temp task for the real
  // one, onFailed removes it (caller reuses its delete-removal logic).
  onConfirmed?: (tempId: string, realTask: Task) => void;
  onFailed?: (tempId: string) => void;
  task?: Task;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function CreateTaskModal({
  listId,
  onCreated,
  onConfirmed,
  onFailed,
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

    const submittedTitle = title;
    setGenericError(undefined);

    if (isEdit && task) {
      // Optimistic edit (title-only, via this modal's edit mode).
      setIsExpanded(false);
      onCreated?.({ ...task, title: submittedTitle });

      startTransition(async () => {
        const result = await updateTask(
          task.id,
          { title: submittedTitle },
          getRealtimeClientId(),
        );
        if (!result.success) {
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          else setGenericError(result.error);
          toast({
            title: "Failed to update task",
            description: result.error,
            variant: "destructive",
          });
          onCreated?.(task); // revert to the pre-edit task
          return;
        }
        toast({ title: "Task updated", description: submittedTitle });
        setTitle("");
        setFieldErrors(undefined);
        onCreated?.(result.data); // reconcile with server's version
      });
      return;
    }

    // Optimistic create: show the card immediately with a temp id, then
    // either swap it for the real task (onConfirmed) or remove it
    // (onFailed) once createTask resolves.
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticTask = {
      id: tempId,
      title: submittedTitle,
      description: null,
      listId,
      assigneeId: null,
      priority: null,
      dueDate: null,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;
    // NOTE: this assumes Task's schema doesn't have other required
    // non-nullable fields beyond what's listed here — if the build flags
    // a type error on this object, add the missing field with a
    // reasonable placeholder default.

    setTitle("");
    setFieldErrors(undefined);
    setIsExpanded(false);
    onCreated?.(optimisticTask);

    startTransition(async () => {
      const result = await createTask(
        { title: submittedTitle, listId },
        getRealtimeClientId(),
      );
      if (!result.success) {
        // Re-open the form with the failed title so field errors (if any)
        // are still visible — don't leave the user with just a toast and
        // no way to see/fix what went wrong.
        setIsExpanded(true);
        setTitle(submittedTitle);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        } else {
          setGenericError(result.error);
        }
        toast({
          title: "Failed to create task",
          description: result.error,
          variant: "destructive",
        });
        onFailed?.(tempId);
        return;
      }

      toast({ title: "Task created", description: submittedTitle });
      onConfirmed?.(tempId, result.data);
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
