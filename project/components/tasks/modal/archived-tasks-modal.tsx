// components/tasks/modal/archived-tasks-modal.tsx
"use client"

import { Loader2, X } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import type { TaskWithCommentCount } from "@/components/lists/board"
import { TaskDetailModal } from "@/components/tasks/modal/task-detail-modal"
import { TaskCardView } from "@/components/tasks/task-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getAssignableUsers } from "@/lib/actions/project-member"
import {
  deleteTask,
  getArchivedTasksByProject,
  restoreTask,
} from "@/lib/actions/tasks"
import type { Task } from "@/lib/db/schema"
import { getRealtimeClientId } from "@/lib/realtime/client"
import { useBoardStore } from "@/stores/board-store"
import { useTaskDetailStore } from "@/stores/task-detail-store"

export function ArchivedTasksModal({
  projectId,
  open,
  onOpenChange,
  role,
}: {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  role: "owner" | "admin" | "editor" | "contributor" | "viewer"
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [archivedTasks, setArchivedTasks] = useState<TaskWithCommentCount[]>([])
  const lists = useBoardStore((s) => s.lists)
  const insertTaskAt = useBoardStore((s) => s.insertTaskAt)

  const [isPending, startTransition] = useTransition()
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null)

  const openModalInStore = useTaskDetailStore((s) => s.openModal)
  const activeModalTaskId = useTaskDetailStore((s) => s.task?.id)

  const [assignableUsers, setAssignableUsers] = useState<
    {
      id: string
      name?: string
      email?: string
      imageUrl?: string | null
      hasImage?: boolean | null
    }[]
  >([])

  useEffect(() => {
    if (open) {
      setLoading(true)
      Promise.all([
        getArchivedTasksByProject(projectId),
        getAssignableUsers(projectId),
      ])
        .then(([tasksRes, usersRes]) => {
          if (tasksRes.success) {
            setArchivedTasks(tasksRes.data)
          } else {
            toast({
              title: "Failed to load archived tasks",
              description: tasksRes.error,
              variant: "destructive",
            })
          }
          if (usersRes.success) {
            setAssignableUsers(usersRes.data)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open, projectId, role, toast])

  const executeRestoreTask = (taskToRestore: {
    id: string
    title: string
    listId: string
    position: number
    commentCount?: number
    assignees?: any
  }) => {
    startTransition(async () => {
      const res = await restoreTask(taskToRestore.id, getRealtimeClientId())
      if (res.success) {
        toast({
          title: "Task restored",
          description: `"${taskToRestore.title}" has been restored.`,
        })
        setArchivedTasks((prev) =>
          prev.filter((t) => t.id !== taskToRestore.id),
        )

        const restoredTaskWithAssignees = {
          ...res.data,
          commentCount: taskToRestore.commentCount ?? 0,
          assignees: taskToRestore.assignees ?? [],
        }

        insertTaskAt(
          taskToRestore.listId,
          restoredTaskWithAssignees,
          res.data.position,
        )

        if (activeModalTaskId === taskToRestore.id) {
          useTaskDetailStore.getState().closeModal()
        }
      } else {
        toast({
          title: "Failed to restore task",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  const handlePermanentDelete = (task: Task) => {
    startTransition(async () => {
      const res = await deleteTask(task.id, getRealtimeClientId())
      if (res.success) {
        toast({
          title: "Task deleted permanently",
          description: `"${task.title}" was deleted.`,
        })
        setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id))
        setDeleteConfirmTask(null)
        if (activeModalTaskId === task.id) {
          useTaskDetailStore.getState().closeModal()
        }
      } else {
        toast({
          title: "Failed to delete task",
          description: res.error,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Added [&>button]:hidden to hide the default Radix close button */}
      <DialogContent className="fixed inset-y-0 right-0 left-auto h-full w-full max-w-md translate-x-0 translate-y-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right rounded-none border-l border-border bg-card text-card-foreground shadow-2xl p-6 flex flex-col [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border shrink-0 space-y-0">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Archived Tasks
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={24}
              />
            </div>
          ) : archivedTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">
              No archived tasks found for this project.
            </p>
          ) : (
            <div className="space-y-4 pr-1">
              {archivedTasks.map((task) => {
                const rawAssignees =
                  (task as any).assignees ?? (task as any).taskAssignees ?? []
                const formattedTask = {
                  ...task,
                  assignees: rawAssignees.map((a: any) => ({
                    userId: a.userId ?? a.id ?? a.user?.id,
                    name: a.name ?? a.userName ?? a.user?.name,
                    email: a.email ?? a.userEmail ?? a.user?.email,
                    imageUrl: a.imageUrl ?? a.userImageUrl ?? a.user?.imageUrl,
                    hasImage: a.hasImage ?? a.userHasImage ?? a.user?.hasImage,
                  })),
                }

                return (
                  <div key={task.id} className="space-y-1.5">
                    <TaskCardView
                      task={formattedTask}
                      interactive={true}
                      onOpenDetail={() =>
                        openModalInStore(
                          { ...formattedTask, isArchived: true },
                          projectId,
                        )
                      }
                    />

                    {role !== "viewer" && role !== "contributor" && (
                      <div className="flex items-center space-x-2 text-xs px-1 text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => executeRestoreTask(task)}
                          disabled={isPending}
                          className="hover:text-foreground font-medium transition-colors cursor-pointer"
                        >
                          Restore
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTask(task)}
                          disabled={isPending}
                          className="hover:text-destructive font-medium transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmTask && (
          <Dialog
            open={!!deleteConfirmTask}
            onOpenChange={() => setDeleteConfirmTask(null)}
          >
            <DialogContent className="max-w-sm bg-card text-card-foreground border-border/80 rounded-2xl shadow-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  Delete permanently?
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to permanently delete &quot;
                {deleteConfirmTask.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmTask(null)}
                  className="h-8 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl shadow-2xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handlePermanentDelete(deleteConfirmTask)}
                  className="h-8 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-2xs cursor-pointer"
                >
                  Delete permanently
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <TaskDetailModal
          role={role}
          currentUserId=""
          assignableUsers={assignableUsers}
          allLists={lists}
          onRestored={() => {
            const activeTask = useTaskDetailStore.getState().task
            if (activeTask) {
              setArchivedTasks((prev) =>
                prev.filter((t) => t.id !== activeTask.id),
              )
              insertTaskAt(
                activeTask.listId,
                { ...activeTask, isArchived: false },
                activeTask.position ?? 0,
              )
              useTaskDetailStore.getState().closeModal()
            }
          }}
          onDeleteClick={() => {
            const currentTask = archivedTasks.find(
              (t) => t.id === activeModalTaskId,
            )
            if (currentTask) setDeleteConfirmTask(currentTask)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
