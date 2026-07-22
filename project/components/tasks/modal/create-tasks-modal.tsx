"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions/tasks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateTaskModal({
  listId,
  onCreated,
}: {
  listId: string;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [assignToMe, setAssignToMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >();
  const [genericError, setGenericError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenericError(undefined);
    startTransition(async () => {
      const result = await createTask({
        title,
        description: description || undefined,
        listId,
        priority: priority || undefined,
        dueDate: dueDate || undefined,
        assignToMe,
      });

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        } else {
          setGenericError(result.error);
        }
        return;
      }

      setTitle("");
      setDescription("");
      setPriority("");
      setDueDate("");
      setAssignToMe(false);
      setFieldErrors(undefined);
      setOpen(false);
      onCreated?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-2 border-dashed border-french_gray-300 dark:border-paynes_gray-400 text-paynes_gray-500 dark:text-french_gray-400 hover:border-blue_munsell-500 hover:text-blue_munsell-500"
        >
          + Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
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
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
