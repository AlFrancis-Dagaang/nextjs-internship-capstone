"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MessageSquare } from "lucide-react";
import type { Task } from "@/lib/db/schema";
import { deleteTask, updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailModal } from "@/components/tasks/modal/task-detail-modal";
import { TaskActions } from "./modal/task-actions";
import { DeleteTaskDialog } from "./modal/delete-task-dialog";
import { Input } from "@/components/ui/input";
import { ListWithTasks } from "../lists/board";

const priorityBarStyles: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

export function TaskCard({
  task,
  projectId,
  allLists,
  onUpdated,
  onDeleted,
  onMoved,
}: {
  task: Task;
  projectId: string;
  allLists: ListWithTasks[];
  onUpdated?: (task: Task) => void;
  onDeleted?: () => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isPending, startTransition] = useTransition();

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || title === task.title) {
      setIsRenaming(false);
      setTitle(task.title);
      return;
    }
    startTransition(async () => {
      const result = await updateTask(task.id, { title });
      if (!result.success) {
        toast({
          title: "Failed to rename task",
          description: result.error,
          variant: "destructive",
        });
        setTitle(task.title);
        setIsRenaming(false);
        return;
      }
      toast({ title: "Task updated", description: result.data?.title });
      setIsRenaming(false);
      onUpdated?.(result.data); // <-- was router.refresh()
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast({
          title: "Task deleted",
          description: `"${task.title}" was deleted.`,
        });
        setDeleteOpen(false);
        onDeleted?.(); // <-- was router.refresh()
      } else {
        toast({
          title: "Failed to delete task",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      <div
        onClick={() => setEditOpen(true)}
        className="relative p-3.5 pt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:shadow-md transition-shadow space-y-3 overflow-visible"
      >
        {/* Top Priority Color Indicator Bar */}
        {task.priority && (
          <div
            className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
              priorityBarStyles[task.priority] || "bg-neutral-300"
            }`}
          />
        )}

        {/* Absolute Top-Right Task Actions Menu */}
        <div className="absolute right-2 top-2.5 z-30">
          <TaskActions
            taskId={task.id}
            projectId={projectId}
            currentListId={task.listId}
            allLists={allLists}
            onView={() => setEditOpen(true)}
            onRename={() => {
              setTitle(task.title);
              setIsRenaming(true);
            }}
            onArchive={() => {
              toast({ title: "Task archived", description: task.title });
            }}
            onDeleteClick={() => setDeleteOpen(true)}
            onMoved={(movedTask, affectedTasks) =>
              onMoved?.(movedTask, affectedTasks)
            }
          />
        </div>

        <div className="flex items-start justify-between pr-8">
          <div className="flex items-center space-x-2.5 flex-1">
            <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
            {isRenaming ? (
              <form
                onSubmit={handleRenameSubmit}
                className="flex-1 mr-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleRenameSubmit}
                  disabled={isPending}
                  className="h-7 px-1.5 text-sm font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-sm focus-visible:ring-1"
                />
              </form>
            ) : (
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                {task.title}
              </h4>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1">
          <div className="flex items-center space-x-3">
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar size={13} className="text-neutral-400" />
                <span>
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <MessageSquare size={13} className="text-neutral-400" />
              <span>3</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                U
              </div>
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                U
              </div>
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                U
              </div>
            </div>
            <span className="ml-1 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-cyan-400 text-neutral-900 text-[10px] font-semibold">
              +2
            </span>
          </div>
        </div>

        <TaskDetailModal
          task={task}
          projectId={projectId}
          allLists={allLists}
          open={editOpen}
          onOpenChange={setEditOpen}
          onChanged={(updatedTask) => onUpdated?.(updatedTask)}
          onMoved={(movedTask, affectedTasks) =>
            onMoved?.(movedTask, affectedTasks)
          }
          onDeleteClick={() => setDeleteOpen(true)}
          onArchive={() => {
            toast({ title: "Task archived", description: task.title });
          }}
        />
      </div>

      <DeleteTaskDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        taskTitle={task.title}
        isPending={isPending}
      />
    </>
  );
}
