// components/tasks/task-card.tsx
"use client";

import { useState, useTransition } from "react";
import { Calendar, MessageSquare } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/db/schema";
import { deleteTask, updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskActions } from "./modal/task-actions";
import { DeleteTaskDialog } from "./modal/delete-task-dialog";
import { Input } from "@/components/ui/input";
import { ListWithTasks, TaskWithCommentCount } from "../lists/board";

const priorityBarStyles: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

/**
 * #21 — pure presentational card body, no hooks. Used by `TaskCard` below
 * (the real, draggable, interactive card) AND directly by board.tsx's
 * `DragOverlay` (the floating preview while dragging). Kept hook-free
 * specifically so DragOverlay can render it without a second `useSortable`
 * call for the same task id fighting the real card's.
 */
export function TaskCardView({
  task,
  interactive = true,
  onOpenDetail,
  cornerActions,
  className = "",
}: {
  task: TaskWithCommentCount;
  interactive?: boolean;
  onOpenDetail?: () => void;
  cornerActions?: React.ReactNode;
  className?: string;
}) {
  const assignees = task.assignees ?? [];
  const visibleAssignees = assignees.slice(0, 3);
  const extraCount = assignees.length > 3 ? assignees.length - 3 : 0;

  return (
    <div
      onClick={interactive ? onOpenDetail : undefined}
      className={`relative p-3.5 pt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow space-y-3 overflow-visible ${
        interactive ? "cursor-pointer" : ""
      } ${className}`}
    >
      {task.priority && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
            priorityBarStyles[task.priority] || "bg-neutral-300"
          }`}
        />
      )}

      {cornerActions && (
        <div className="absolute right-2 top-2.5 z-30">{cornerActions}</div>
      )}

      <div className="flex items-start justify-between pr-8">
        <div className="flex items-center space-x-2.5 flex-1">
          <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {task.title}
          </h4>
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
            <span>{task.commentCount ?? 0}</span>
          </div>
        </div>

        {assignees.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {visibleAssignees.map((a) => (
                <div
                  key={a.userId}
                  className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-white dark:border-neutral-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold uppercase"
                  title={a.name ?? a.email}
                >
                  {a.name?.[0] ?? a.email?.[0] ?? "U"}
                </div>
              ))}
            </div>
            {extraCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-cyan-400 text-neutral-900 text-[10px] font-semibold">
                +{extraCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  projectId,
  allLists,
  canEdit,
  onArchived,
  onUpdated,
  onDeleted,
  onDeleteFailed,
  onMoved,
  onOpenDetail,
}: {
  task: TaskWithCommentCount;
  projectId: string;
  allLists: ListWithTasks[];
  canEdit: boolean;

  onUpdated?: (task: TaskWithCommentCount) => void;
  onDeleted?: () => void;
  onDeleteFailed?: (task: Task) => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  onOpenDetail: () => void;
  onArchived?: () => void;
}) {
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canEdit });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const isTemp = task.id.startsWith("temp-");

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || title === task.title) {
      setIsRenaming(false);
      setTitle(task.title);
      return;
    }
    const submittedTitle = title;
    setIsRenaming(false);
    onUpdated?.({ ...task, title: submittedTitle });

    startTransition(async () => {
      const result = await updateTask(task.id, { title: submittedTitle });
      if (!result.success) {
        toast({
          title: "Failed to rename task",
          description: result.error,
          variant: "destructive",
        });
        setTitle(task.title);
        onUpdated?.(task);
        return;
      }
      toast({ title: "Task updated", description: result.data?.title });
      onUpdated?.(result.data);
    });
  }

  function handleDelete() {
    setDeleteOpen(false);
    onDeleted?.();

    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast({
          title: "Task deleted",
          description: `"${task.title}" was deleted.`,
        });
      } else {
        toast({
          title: "Failed to delete task",
          description: result.error,
          variant: "destructive",
        });
        onDeleteFailed?.(task);
      }
    });
  }

  const cornerActions = (
    <TaskActions
      taskId={task.id}
      projectId={projectId}
      currentListId={task.listId}
      allLists={allLists}
      canEdit={canEdit}
      onView={onOpenDetail}
      onRename={() => {
        setTitle(task.title);
        setIsRenaming(true);
      }}
      onArchive={() => {
        onArchived?.();
        toast({ title: "Task archived", description: task.title });
      }}
      onDeleteClick={() => setDeleteOpen(true)}
      onMoved={(movedTask, affectedTasks) =>
        onMoved?.(movedTask, affectedTasks)
      }
      onAssigned={(assignee) => {
        const updatedAssignees = [...(task.assignees ?? []), assignee];
        onUpdated?.({ ...task, assignees: updatedAssignees });
      }}
    />
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={dragStyle}
        {...attributes}
        {...(canEdit ? listeners : {})}
      >
        {isRenaming ? (
          <div className="relative p-3.5 pt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3 overflow-visible">
            {task.priority && (
              <div
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                  priorityBarStyles[task.priority] || "bg-neutral-300"
                }`}
              />
            )}
            <div className="flex items-center space-x-2.5 pr-8">
              <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
              <form onSubmit={handleRenameSubmit} className="flex-1">
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleRenameSubmit}
                  disabled={isPending}
                  className="h-7 px-1.5 text-sm font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-sm focus-visible:ring-1"
                />
              </form>
            </div>
          </div>
        ) : (
          <TaskCardView
            task={task}
            interactive={!isTemp}
            onOpenDetail={isTemp ? undefined : onOpenDetail}
            cornerActions={isTemp ? undefined : cornerActions}
            className={isDragging ? "opacity-40 cursor-grabbing shadow-lg" : ""}
          />
        )}
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
