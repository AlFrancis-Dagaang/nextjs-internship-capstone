// components/projects/project-detail/project-info.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calendar, Clock, Edit2, Trash2 } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DeleteProjectModal } from "../modals/delete-project-modal";

type ProjectInfoProps = {
  project: Project;
  isOwner: boolean;
  onProjectChanged?: (project: Project) => void;
  onProjectDeleted?: () => void;
};

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

export function ProjectInfo({
  project,
  isOwner,
  onProjectChanged,
  onProjectDeleted,
}: ProjectInfoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Description editing state
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");

  // Due date state
  const [dueDate, setDueDate] = useState(toDateInputValue(project.dueDate));

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleSaveDescription() {
    const submittedDesc = description;
    setIsEditingDesc(false);

    startTransition(async () => {
      const result = await updateProject(project.id, {
        description: submittedDesc || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update description",
          description: result.error,
          variant: "destructive",
        });
        setDescription(project.description ?? "");
        setIsEditingDesc(true);
        return;
      }

      toast({ title: "Project description updated" });
      onProjectChanged?.(result.data);
      router.refresh();
    });
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    setDueDate(newDate);
    const parsedDate = newDate ? new Date(newDate) : null;

    startTransition(async () => {
      const result = await updateProject(project.id, {
        dueDate: parsedDate || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update due date",
          description: result.error,
          variant: "destructive",
        });
        setDueDate(toDateInputValue(project.dueDate));
        return;
      }

      toast({ title: "Project due date updated" });
      onProjectChanged?.(result.data);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" was permanently deleted.`,
        });
        setDeleteOpen(false);
        onProjectDeleted?.();
        router.push("/projects");
        router.refresh();
      } else {
        toast({
          title: "Failed to delete project",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Description
              </h4>
              {isOwner && !isEditingDesc && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDesc(true)}
                  className="h-7 text-xs shadow-none border-neutral-200 dark:border-neutral-700"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingDesc && isOwner ? (
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 focus-within:ring-1 focus-within:ring-cyan-400">
                <Textarea
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="h-32 max-h-48 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-none shadow-none text-sm bg-white dark:bg-neutral-900 px-3 py-2.5 overflow-y-auto"
                />
                <div className="p-2 flex justify-end gap-2 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-neutral-200 dark:border-neutral-700"
                    onClick={() => {
                      setDescription(project.description ?? "");
                      setIsEditingDesc(false);
                    }}
                    disabled={isPending}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium shadow-none"
                    onClick={handleSaveDescription}
                    disabled={isPending}
                    type="button"
                  >
                    {isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => isOwner && setIsEditingDesc(true)}
                className={`p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed min-h-[100px] whitespace-pre-wrap ${
                  isOwner
                    ? "hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-colors"
                    : ""
                }`}
              >
                {project.description ? (
                  project.description
                ) : (
                  <span className="text-neutral-400 italic">
                    No project description provided.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Project Metadata
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {/* Due Date Row */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
                <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-cyan-500" /> Due Date
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={handleDateChange}
                    disabled={!isOwner || isPending}
                    className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-9 text-sm focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Created At Row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                <div className="flex items-center space-x-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <Clock size={15} className="text-cyan-500" />
                  <span>Created At</span>
                </div>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  {project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Danger Zone Footer */}
        {isOwner && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Danger Zone</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="h-8 text-xs rounded-lg shadow-none flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Delete Project
            </Button>
          </div>
        )}
      </div>

      <DeleteProjectModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        projectName={project.name}
        isPending={isPending}
      />
    </>
  );
}
