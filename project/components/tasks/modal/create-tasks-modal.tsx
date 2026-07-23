"use client";

import { useState, useTransition, useEffect } from "react";
import { createTask, updateTask } from "@/lib/actions/tasks";
import type { Task } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

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
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: CreateTaskModalProps) {
  const isEdit = Boolean(task);
  const { toast } = useToast();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<string>(task?.priority ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate));
  const [assignToMe, setAssignToMe] = useState(Boolean(task?.assigneeId));
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [genericError, setGenericError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setPriority(task?.priority ?? "");
      setDueDate(toDateInputValue(task?.dueDate));
      setAssignToMe(Boolean(task?.assigneeId));
      setFieldErrors(undefined);
      setGenericError(undefined);
    }
  }, [open, task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenericError(undefined);
    startTransition(async () => {
      const input = {
        title,
        description: description || undefined,
        listId,
        priority: priority || undefined,
        dueDate: dueDate || undefined,
        assignToMe,
      };

      const result = isEdit
        ? await updateTask(task!.id, input)
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

      if (!isEdit) {
        setTitle("");
        setDescription("");
        setPriority("");
        setDueDate("");
        setAssignToMe(false);
        setFieldErrors(undefined);
      }
      setOpen(false);
      onCreated?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isEdit ? (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-2 border-dashed border-french_gray-300 dark:border-paynes_gray-400 text-paynes_gray-500 dark:text-french_gray-400 hover:border-blue_munsell-500 hover:text-blue_munsell-500"
          >
            + Add task
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {genericError && (
            <p className="text-destructive text-sm">{genericError}</p>
          )}
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
            {fieldErrors?.title && (
              <p className="text-destructive text-xs">{fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
            {fieldErrors?.description && (
              <p className="text-destructive text-xs">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="assignToMe"
              type="checkbox"
              checked={assignToMe}
              onChange={(e) => setAssignToMe(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="assignToMe" className="cursor-pointer">
              Assign to me
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save"
                  : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
