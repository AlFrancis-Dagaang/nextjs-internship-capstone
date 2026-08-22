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
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";

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
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const router = useRouter();

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [dueDate, setDueDate] = useState<string>(
    project?.dueDate
      ? new Date(project.dueDate).toISOString().split("T")[0]
      : "",
  );

  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setDueDate(
        project?.dueDate
          ? new Date(project.dueDate).toISOString().split("T")[0]
          : "",
      );
      setFieldErrors(undefined);
    }
  }, [open, project]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return; // Extra layer of safety protection

    startTransition(async () => {
      const input = {
        name,
        description: description || undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
      };

      const result = isEdit
        ? await updateProject(project!.id, input)
        : await createProject(input);

      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        return;
      }

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
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs px-4 rounded-xl shadow-xs transition-all">
            + New Project
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="bg-card border border-border/80 rounded-3xl shadow-sm p-6 sm:p-7 max-w-md w-full">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-foreground text-sm font-bold tracking-tight">
            {isEdit ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Project Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-semibold text-foreground"
            >
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sample Project Tracking"
              className="h-10 text-xs bg-secondary/40 border-border/80 text-foreground rounded-2xl focus-visible:ring-1 focus-visible:ring-primary px-3.5"
            />
            {fieldErrors?.name && (
              <p className="text-destructive text-[11px] font-medium mt-1">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-semibold text-foreground"
            >
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of project goals..."
              className="min-h-20 text-xs bg-secondary/40 border-border/80 text-foreground rounded-2xl focus-visible:ring-1 focus-visible:ring-primary p-3.5 resize-none"
            />
            {fieldErrors?.description && (
              <p className="text-destructive text-[11px] font-medium mt-1">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* Due Date Calendar Picker */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dueDate"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <CalendarIcon size={13} className="text-primary" />
              Due Date{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 text-xs bg-secondary/40 border-border/80 text-foreground rounded-2xl focus-visible:ring-1 focus-visible:ring-primary px-3.5 block w-full"
            />
            {fieldErrors?.dueDate && (
              <p className="text-destructive text-[11px] font-medium mt-1">
                {fieldErrors.dueDate[0]}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9 text-xs rounded-xl border-border/80 bg-card text-foreground hover:bg-secondary/60 font-medium px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="h-9 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
