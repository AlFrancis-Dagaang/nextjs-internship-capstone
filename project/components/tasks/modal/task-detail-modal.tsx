"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Task } from "@/lib/db/schema";
import type { ListWithTasks } from "@/components/lists/board";
import { TaskHeader } from "@/components/tasks/tast-detail-modal/task-header";
import { TaskDescription } from "@/components/tasks/tast-detail-modal/task-description";
import { TaskSidebar } from "@/components/tasks/tast-detail-modal/task-sidebar";
import { TaskComments } from "../tast-detail-modal/task-comments";

type TaskDetailModalProps = {
  task: Task;
  projectId: string;
  allLists: ListWithTasks[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: (task: Task) => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  onDeleteClick?: () => void;
  onArchive?: () => void;
};

export function TaskDetailModal({
  task,
  projectId,
  allLists,
  open,
  onOpenChange,
  onChanged,
  onMoved,
  onDeleteClick,
  onArchive,
}: TaskDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Added gap-0 and space-y-0 to force the dialog role div to have zero internal vertical spacing */}
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-white dark:bg-neutral-950 flex flex-col [&>button]:hidden">
        {" "}
        {/* Header - Fixed & Pinned */}
        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0 flex items-start justify-between gap-4">
          <div className="flex-1">
            <TaskHeader task={task} onChanged={onChanged} />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
            className="relative z-50 mt-1 p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* 2-Column Layout Container - Sits completely flush against the header border */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Content */}
          <div className="flex-1 p-6 flex flex-col overflow-hidden">
            <div className="shrink-0 pb-6 border-b border-neutral-100 dark:border-neutral-900">
              <TaskDescription task={task} onChanged={onChanged} />
            </div>

            <div className="flex-1 pt-6 overflow-hidden flex flex-col">
              <TaskComments taskId={task.id} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full md:w-[320px] shrink-0 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6 flex flex-col overflow-hidden">
            <TaskSidebar
              task={task}
              projectId={projectId}
              allLists={allLists}
              onChanged={onChanged}
              onMoved={onMoved}
              onOpenChange={onOpenChange}
              onDeleteClick={onDeleteClick}
              onArchive={onArchive}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
