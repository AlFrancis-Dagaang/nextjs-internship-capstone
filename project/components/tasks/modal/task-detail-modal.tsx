"use client";

import { useState, useTransition, useEffect } from "react";
import { updateTask } from "@/lib/actions/tasks";
import { useTaskLists, useMoveTask } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskActivityFeed } from "@/components/tasks/task-activity-feed";
import { TaskComments } from "../task-comments";

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

type TaskDetailModalProps = {
  task: Task;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

export function TaskDetailModal({
  task,
  projectId,
  open,
  onOpenChange,
  onChanged,
}: TaskDetailModalProps) {
  const { toast } = useToast();
  const { lists, loadLists } = useTaskLists(projectId);
  const { moveTask, isMoving } = useMoveTask();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<string>(task.priority ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority ?? "");
      setDueDate(toDateInputValue(task.dueDate));
      setFieldErrors(undefined);
      loadLists();
    }
    // loadLists is stable via useCallback on projectId; safe to omit here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title,
        description: description || undefined,
        priority: priority || undefined,
        dueDate: dueDate || undefined,
      });

      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        toast({
          title: "Failed to update task",
          description: result.fieldErrors
            ? "Please check the highlighted fields."
            : result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Task updated", description: title });
      onChanged?.();
    });
  }

  function handleMove(newListId: string) {
    if (newListId === task.listId) return;
    moveTask(task.id, newListId, () => {
      onChanged?.();
      onOpenChange(false);
    });
  }

  const isBusy = isPending || isMoving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="move-list">List</Label>
            <Select value={task.listId} onValueChange={handleMove}>
              <SelectTrigger id="move-list">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {fieldErrors?.title && (
                <p className="text-destructive text-xs">
                  {fieldErrors.title[0]}
                </p>
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
          <div className="space-y-1 border-t pt-4">
            <Label>Activity</Label>
            <TaskActivityFeed taskId={task.id} />
            <TaskComments taskId={task.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
