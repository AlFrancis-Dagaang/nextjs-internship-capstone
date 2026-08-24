"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Calendar, MessageSquare, Check } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/db/schema";
import {
  deleteTask,
  updateTask,
  toggleTaskComplete,
} from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskActions } from "./modal/task-actions";
import { DeleteTaskDialog } from "./modal/delete-task-dialog";
import { Input } from "@/components/ui/input";
import { useBoardStore } from "@/stores/board-store";
import { UserAvatar } from "@/components/ui/user-avatar";

const priorityBarStyles: Record<string, string> = {
  low: "bg-blue-500",
  medium: "bg-amber-500",
  high: "bg-destructive",
};

export type TaskWithCommentCount = Task & {
  commentCount?: number;
  projectId?: string;
  projectName?: string;
  assignees?: {
    userId: string;
    name?: string;
    email?: string;
    imageUrl?: string | null;
    hasImage?: boolean | null;
  }[];
};

export function TaskCardView({
  task,
  interactive = true,
  onToggleComplete,
  onOpenDetail,
  cornerActions,
  selectionMode = false,
  isSelected = false,
  onToggleSelected,
  className = "",
}: {
  task: TaskWithCommentCount;
  interactive?: boolean;
  onToggleComplete?: () => void;
  onOpenDetail?: () => void;
  cornerActions?: React.ReactNode;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelected?: () => void;
  className?: string;
}) {
  const assignees = task.assignees ?? [];
  const visibleAssignees = assignees.slice(0, 3);
  const extraCount = assignees.length > 3 ? assignees.length - 3 : 0;
  const tooltipText = task.isCompleted ? "Mark incomplete" : "Mark completed";

  return (
    <div
      onClick={
        interactive
          ? selectionMode
            ? onToggleSelected
            : onOpenDetail
          : undefined
      }
      className={`relative p-3.5 pt-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow space-y-3 overflow-hidden shadow-sm ${
        interactive ? "cursor-pointer" : ""
      } ${className}`}
    >
      {task.priority && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
            priorityBarStyles[task.priority] || "bg-border"
          }`}
        />
      )}

      {cornerActions && (
        <div className="absolute right-2 top-2.5 z-30">{cornerActions}</div>
      )}

      <div className="flex items-start justify-between pr-8">
        <div className="flex items-center space-x-2.5 flex-1">
          {selectionMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelected?.();
              }}
              className={`w-4 h-4 rounded border shrink-0 transition-colors flex items-center justify-center ${
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}
              aria-label={isSelected ? "Deselect task" : "Select task"}
            >
              {isSelected && <Check size={10} strokeWidth={3} />}
            </button>
          ) : onToggleComplete ? (
            <button
              type="button"
              title={tooltipText}
              aria-label={tooltipText}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
              className={`w-4 h-4 rounded-full border shrink-0 transition-colors flex items-center justify-center ${
                task.isCompleted
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
            >
              {task.isCompleted && <Check size={10} strokeWidth={3} />}
            </button>
          ) : (
            <div
              className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                task.isCompleted
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {task.isCompleted && <Check size={10} strokeWidth={3} />}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <h4
              className={`font-medium text-sm truncate ${
                task.isCompleted
                  ? "line-through text-muted-foreground/60"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </h4>
            {task.projectName && task.projectId && (
              <div className="mt-1">
                <Link
                  href={`/projects/${task.projectId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 transition-colors"
                >
                  {task.projectName}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div className="flex items-center space-x-3">
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar size={13} className="text-muted-foreground" />
              <span>
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <MessageSquare size={13} className="text-muted-foreground" />
            <span>{task.commentCount ?? 0}</span>
          </div>
        </div>

        {assignees.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {visibleAssignees.map((a: any) => {
                const displayName = a.name || a.email || "User";
                const stableKey = a.userId || a.email || a.id;

                return (
                  <UserAvatar
                    key={stableKey}
                    userId={stableKey}
                    name={displayName}
                    imageUrl={a.imageUrl}
                    hasImage={a.hasImage ?? false}
                    className="w-6 h-6 text-[9px]"
                    title={displayName}
                  />
                );
              })}
            </div>
            {extraCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold border border-border">
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
  dragDisabled = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelected,
  canContribute,
  onArchived,
  onUpdated,
  onDeleted,
  onDeleteFailed,
  onMoved,
  onOpenDetail,
}: {
  task: TaskWithCommentCount;
  projectId: string;
  allLists: any[];
  canEdit: boolean;
  canContribute: boolean;
  dragDisabled?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelected?: () => void;
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

  const toggleTaskCompleteLocally = useBoardStore(
    (state) => state.toggleTaskCompleteLocally,
  );
  const revertTaskComplete = useBoardStore((state) => state.revertTaskComplete);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canContribute || dragDisabled });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const isTemp = task.id.startsWith("temp-");

  function handleToggleComplete() {
    const previousValue = toggleTaskCompleteLocally(task.id);

    startTransition(async () => {
      const result = await toggleTaskComplete(task.id);
      if (!result.success) {
        revertTaskComplete(task.id, previousValue);
        toast({
          title: "Failed to update task",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      onUpdated?.({
        ...(result.data as TaskWithCommentCount),
        assignees: task.assignees,
      });
    });
  }

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
      onUpdated?.({ ...result.data, assignees: task.assignees });
    });
  }

  function handleDelete() {
    setDeleteOpen(false);
    onDeleted?.();

    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.success) {
        toast({
          title: "Failed to delete task",
          description: result.error,
          variant: "destructive",
        });
        onDeleteFailed?.(task);
      } else {
        toast({
          title: "Task deleted",
          description: `"${task.title}" was deleted.`,
        });
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
      canContribute={canContribute}
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
        {...(canContribute ? listeners : {})}
      >
        {isRenaming ? (
          <div className="relative p-3.5 pt-4 bg-card rounded-xl border border-border space-y-3 overflow-hidden shadow-sm">
            {task.priority && (
              <div
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                  priorityBarStyles[task.priority] || "bg-border"
                }`}
              />
            )}
            <div className="flex items-center space-x-2.5 pr-8">
              <div className="w-4 h-4 rounded-full border border-border shrink-0" />
              <form onSubmit={handleRenameSubmit} className="flex-1">
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleRenameSubmit}
                  disabled={isPending}
                  className="h-7 px-1.5 text-sm font-medium bg-card border border-input rounded shadow-sm focus-visible:ring-1"
                />
              </form>
            </div>
          </div>
        ) : (
          <div className="relative">
            <TaskCardView
              task={task}
              interactive={!isTemp}
              selectionMode={selectionMode}
              isSelected={isSelected}
              onToggleSelected={onToggleSelected}
              onToggleComplete={
                canContribute && !isTemp && !selectionMode
                  ? handleToggleComplete
                  : undefined
              }
              onOpenDetail={
                isTemp || selectionMode
                  ? selectionMode && canEdit
                    ? onToggleSelected
                    : undefined
                  : onOpenDetail
              }
              cornerActions={
                isTemp || selectionMode ? undefined : cornerActions
              }
              className={`${isDragging ? "opacity-40 cursor-grabbing shadow-lg" : ""} ${
                isSelected ? "ring-2 ring-primary bg-primary/10" : ""
              }`}
            />
          </div>
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
