// components/tasks/modal/task-detail-modal.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { X, FileText, Sidebar } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Task } from "@/lib/db/schema";
import type {
  ListWithTasks,
  TaskWithCommentCount,
} from "@/components/lists/board";
import { TaskHeader } from "@/components/tasks/tast-detail-modal/task-header";
import { TaskDescription } from "@/components/tasks/tast-detail-modal/task-description";
import { TaskSidebar } from "@/components/tasks/tast-detail-modal/task-sidebar";
import { TaskComments } from "../tast-detail-modal/task-comments";
import { archiveTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { useBoardStore } from "@/stores/board-store";

type TaskDetailModalProps = {
  task: Task;
  projectId: string;
  allLists: ListWithTasks[];
  assignableUsers: {
    id: string;
    name?: string;
    email?: string;
    imageUrl?: string | null;
    hasImage?: boolean | null;
  }[];
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  onRestored?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: (task: TaskWithCommentCount) => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  onDeleteClick?: () => void;
  onCommentCountChanged?: (taskId: string, delta: number) => void;
};

export function TaskDetailModal({
  task,
  projectId,
  allLists,
  assignableUsers,
  open,
  role,
  onRestored,
  onOpenChange,
  onChanged,
  onMoved,
  onDeleteClick,
  onCommentCountChanged,
}: TaskDetailModalProps) {
  const { toast } = useToast();
  const archiveTaskLocally = useBoardStore((s) => s.archiveTaskLocally);
  const revertArchiveSnapshot = useBoardStore((s) => s.revertArchiveSnapshot);

  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "sidebar">("details");

  const bumpActivity = useCallback(() => {
    setActivityRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    bumpActivity();
  }, [task, bumpActivity]);

  // Reset tab selection when modal opens/closes
  useEffect(() => {
    if (open) setActiveTab("details");
  }, [open]);

  const isArchived = Boolean(task.isArchived);
  const canEdit = role !== "viewer" && role !== "contributor" && !isArchived;
  const canContribute = role !== "viewer";

  const handleChanged = useCallback(
    (updated: TaskWithCommentCount) => {
      onChanged?.(updated);
      bumpActivity();
    },
    [onChanged, bumpActivity],
  );

  const handleMoved = useCallback(
    (movedTask: Task, affectedTasks: Task[]) => {
      onMoved?.(movedTask, affectedTasks);
      bumpActivity();
    },
    [onMoved, bumpActivity],
  );

  const handleArchive = async () => {
    onOpenChange(false);
    const snapshot = archiveTaskLocally(task.id);
    const res = await archiveTask(task.id);
    if (res.success) {
      toast({
        title: "Task archived",
        description: `"${task.title}" was archived.`,
      });
    } else {
      revertArchiveSnapshot(snapshot);
      toast({
        title: "Failed to archive task",
        description: res.error,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] p-0 overflow-hidden bg-card text-card-foreground border-border rounded-3xl shadow-2xl flex flex-col [&>button]:hidden">
        {/* Header - Fixed & Pinned */}
        <div className="px-4 sm:px-6 py-4 border-b border-border/80 shrink-0 flex items-start justify-between gap-4 bg-card">
          <div className="flex-1 min-w-0">
            <TaskHeader
              task={task}
              canEdit={canEdit}
              canContribute={canContribute}
              onChanged={handleChanged}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
            className="relative z-50 mt-1 p-1.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Tab Switcher Bar (Visible only on Mobile) */}
        <div className="flex md:hidden border-b border-border bg-muted/20 px-4 py-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "details"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <FileText size={14} />
            <span>Task Details</span>
          </button>
          <button
            onClick={() => setActiveTab("sidebar")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "sidebar"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Sidebar size={14} />
            <span>Activity & Sidebar</span>
          </button>
        </div>

        {/* Desktop View: Side-by-Side 2-Column Layout */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-background/40">
          {/* Left Content */}
          <div className="flex-1 p-6 flex flex-col overflow-hidden bg-card">
            <div className="shrink-0 pb-6 border-b border-border/60">
              <TaskDescription
                task={task}
                canEdit={canEdit}
                onChanged={handleChanged}
              />
            </div>
            <div className="flex-1 pt-6 overflow-hidden flex flex-col">
              <TaskComments
                taskId={task.id}
                refreshKey={activityRefreshKey}
                onCommentCountChanged={onCommentCountChanged}
                onActivityChanged={bumpActivity}
                canEdit={canEdit}
                canContribute={canContribute}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-[320px] shrink-0 border-l border-border/80 bg-muted/30 p-6 flex flex-col overflow-y-auto">
            <TaskSidebar
              task={task}
              projectId={projectId}
              allLists={allLists}
              assignableUsers={assignableUsers}
              canEdit={canEdit}
              onChanged={handleChanged}
              onMoved={handleMoved}
              activityRefreshKey={activityRefreshKey}
              onOpenChange={onOpenChange}
              onDeleteClick={onDeleteClick}
              onArchive={handleArchive}
              role={role}
              onRestored={onRestored}
            />
          </div>
        </div>

        {/* Mobile View: Tabbed Layout */}
        <div className="flex md:hidden flex-1 overflow-y-auto bg-background/40">
          {activeTab === "details" ? (
            <div className="w-full p-4 sm:p-6 flex flex-col bg-card space-y-6">
              <div className="pb-4 border-b border-border/60">
                <TaskDescription
                  task={task}
                  canEdit={canEdit}
                  onChanged={handleChanged}
                />
              </div>
              <div className="flex flex-col flex-1">
                <TaskComments
                  taskId={task.id}
                  refreshKey={activityRefreshKey}
                  onCommentCountChanged={onCommentCountChanged}
                  onActivityChanged={bumpActivity}
                  canEdit={canEdit}
                  canContribute={canContribute}
                />
              </div>
            </div>
          ) : (
            <div className="w-full p-4 sm:p-6 bg-muted/30 flex flex-col">
              <TaskSidebar
                task={task}
                projectId={projectId}
                allLists={allLists}
                assignableUsers={assignableUsers}
                canEdit={canEdit}
                onChanged={handleChanged}
                onMoved={handleMoved}
                activityRefreshKey={activityRefreshKey}
                onOpenChange={onOpenChange}
                onDeleteClick={onDeleteClick}
                onArchive={handleArchive}
                role={role}
                onRestored={onRestored}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
