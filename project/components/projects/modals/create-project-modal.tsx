// components/projects/modals/create-project-modal.tsx
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
import { useRouter } from "next/navigation";

type CreateProjectModalProps = {
  onCreated?: (project: Project) => void;
  onUpdated?: (project: Project) => void;
  project?: Project;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function CreateProjectModal({
  onCreated,
  onUpdated,
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
  const router = useRouter();
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
      if (isEdit) {
        onUpdated?.(result.data);
      } else {
        onCreated?.(result.data);
        router.push(`/projects/${result.data.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isEdit ? (
        <DialogTrigger asChild>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/95 font-medium h-9 text-xs shadow-none">
            + New Project
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="bg-card border border-border rounded-xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base font-semibold">
            {isEdit ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-medium text-foreground"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="h-9 text-sm bg-muted border-input text-foreground rounded-lg focus-visible:ring-1"
            />
            {fieldErrors?.name && (
              <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-medium text-foreground"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="min-h-[80px] text-sm bg-muted border-input text-foreground rounded-lg focus-visible:ring-1 resize-none"
            />
            {fieldErrors?.description && (
              <p className="text-destructive text-xs">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9 text-xs rounded-lg border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-none"
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
