"use client";

import { useState, useTransition, useEffect } from "react";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { Project } from "@/lib/db/schema";
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

type CreateProjectModalProps = {
  onCreated?: () => void;
  project?: Project;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function CreateProjectModal({
  onCreated,
  project,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: CreateProjectModalProps) {
  const isEdit = Boolean(project);
  const { toast } = useToast();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setFieldErrors(undefined);
    }
  }, [open, project]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = { name, description: description || undefined };
      const result = isEdit
        ? await updateProject(project!.id, input)
        : await createProject(input);

      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        toast({
          title: isEdit
            ? "Failed to update project"
            : "Failed to create project",
          description: result.fieldErrors
            ? "Please check the highlighted fields."
            : result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isEdit ? "Project updated" : "Project created",
        description: name,
      });
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
          <Button className="bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium h-9 text-xs shadow-none">
            + New Project
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-neutral-900 dark:text-neutral-100 text-base font-semibold">
            {isEdit ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="h-9 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg focus-visible:ring-1"
            />
            {fieldErrors?.name && (
              <p className="text-red-600 dark:text-red-400 text-xs">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="min-h-[80px] text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg focus-visible:ring-1 resize-none"
            />
            {fieldErrors?.description && (
              <p className="text-red-600 dark:text-red-400 text-xs">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9 text-xs rounded-lg border-neutral-200 dark:border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 text-xs rounded-lg bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium shadow-none"
            >
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
