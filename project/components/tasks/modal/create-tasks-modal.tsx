// components/tasks/modal/create-tasks-modal.tsx
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
  onCreated?: (task: Task) => void;
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
          onCreated?.(task);
          return;
        }
        toast({ title: "Task updated", description: submittedTitle });
        setTitle("");
        setFieldErrors(undefined);
        onCreated?.(result.data);
      });
      return;
    }

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
        className="w-full flex items-center space-x-2 bg-card hover:bg-muted text-foreground rounded-lg p-3 font-medium transition-colors text-sm shadow-sm border border-border"
      >
        <Plus size={16} />
        <span>Add a task</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-lg p-3 space-y-3 border border-border shadow-sm"
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
          className="bg-card h-9 text-sm border border-input text-foreground shadow-none focus-visible:ring-1 focus-visible:ring-ring"
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
          className="bg-card text-foreground border-border hover:bg-muted"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
