"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getArchivedTasksByProject,
  restoreTask,
  deleteTask,
} from "@/lib/actions/tasks";
import type { Task } from "@/lib/db/schema";
import type { TaskWithCommentCount } from "@/components/lists/board";
import { useBoardStore } from "@/stores/board-store";
import { Loader2 } from "lucide-react";
import { TaskDetailModal } from "@/components/tasks/modal/task-detail-modal";
import { TaskCardView } from "@/components/tasks/task-card";
import { getAssignableUsers } from "@/lib/actions/project-member";
import { getRealtimeClientId } from "@/lib/realtime/client";

export function ArchivedTasksModal({
  projectId,
  open,
  onOpenChange,
  role,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: "owner" | "editor" | "viewer";
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState<TaskWithCommentCount[]>(
    [],
  );
  const lists = useBoardStore((s) => s.lists);
  const insertTaskAt = useBoardStore((s) => s.insertTaskAt);

  const [isPending, startTransition] = useTransition();
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);
  const [openArchivedTask, setOpenArchivedTask] =
    useState<TaskWithCommentCount | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<
    { id: string; name?: string; email?: string }[]
  >([]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        getArchivedTasksByProject(projectId),
        getAssignableUsers(projectId),
      ])
        .then(([tasksRes, usersRes]) => {
          if (tasksRes.success) {
            setArchivedTasks(tasksRes.data);
          } else {
            toast({
              title: "Failed to load archived tasks",
              description: tasksRes.error,
              variant: "destructive",
            });
          }
          if (usersRes.success) {
            setAssignableUsers(usersRes.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, projectId, role, toast]);

  const handleRestore = (task: Task) => {
    startTransition(async () => {
      const res = await restoreTask(task.id, getRealtimeClientId());
      if (res.success) {
        toast({
          title: "Task restored",
          description: `"${task.title}" has been restored.`,
        });
        setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id));
        insertTaskAt(task.listId, res.data, res.data.position);
        if (openArchivedTask?.id === task.id) {
          setOpenArchivedTask(null);
        }
      } else {
        toast({
          title: "Failed to restore task",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const handlePermanentDelete = (task: Task) => {
    startTransition(async () => {
      const res = await deleteTask(task.id, getRealtimeClientId());
      if (res.success) {
        toast({
          title: "Task deleted permanently",
          description: `"${task.title}" was deleted.`,
        });
        setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id));
        setDeleteConfirmTask(null);
        if (openArchivedTask?.id === task.id) {
          setOpenArchivedTask(null);
        }
      } else {
        toast({
          title: "Failed to delete task",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Archived Tasks
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-neutral-400" size={24} />
          </div>
        ) : archivedTasks.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center">
            No archived tasks found for this project.
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {archivedTasks.map((task) => {
              // Map all possible assignee response formats from backend/server actions
              const rawAssignees =
                (task as any).assignees ?? (task as any).taskAssignees ?? [];
              const formattedTask = {
                ...task,
                assignees: rawAssignees.map((a: any) => ({
                  userId: a.userId ?? a.id ?? a.user?.id,
                  name: a.name ?? a.userName ?? a.user?.name,
                  email: a.email ?? a.userEmail ?? a.user?.email,
                })),
              };

              return (
                <div key={task.id} className="space-y-1.5">
                  <TaskCardView
                    task={formattedTask}
                    interactive={true}
                    onOpenDetail={() =>
                      setOpenArchivedTask({
                        ...formattedTask,
                        isArchived: true,
                      })
                    }
                  />

                  {role !== "viewer" && (
                    <div className="flex items-center space-x-2 text-xs px-1 text-neutral-500">
                      <button
                        type="button"
                        onClick={() => handleRestore(task)}
                        disabled={isPending}
                        className="hover:text-neutral-900 dark:hover:text-neutral-100 font-medium transition-colors cursor-pointer"
                      >
                        Restore
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTask(task)}
                        disabled={isPending}
                        className="hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmTask && (
          <Dialog
            open={!!deleteConfirmTask}
            onOpenChange={() => setDeleteConfirmTask(null)}
          >
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete permanently?</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-neutral-500">
                Are you sure you want to permanently delete &quot;
                {deleteConfirmTask.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handlePermanentDelete(deleteConfirmTask)}
                >
                  Delete permanently
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {openArchivedTask && (
          <TaskDetailModal
            task={openArchivedTask}
            projectId={projectId}
            allLists={lists}
            assignableUsers={assignableUsers}
            role={role}
            open={true}
            onOpenChange={(isOpen) => {
              if (!isOpen) setOpenArchivedTask(null);
            }}
            onChanged={(updated) =>
              setOpenArchivedTask((prev) =>
                prev?.id === updated.id
                  ? { ...prev, ...updated, isArchived: true }
                  : prev,
              )
            }
            onDeleteClick={() => setDeleteConfirmTask(openArchivedTask)}
            onRestored={() => {
              setArchivedTasks((prev) =>
                prev.filter((t) => t.id !== openArchivedTask.id),
              );
              setOpenArchivedTask(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
