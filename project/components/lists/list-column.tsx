// components/projects/list-column.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";
import { updateList, deleteList } from "@/lib/actions/lists";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ListActions } from "./modal/list-actions";
import { DeleteListDialog } from "./modal/delete-list-dialog";
import type { List, Task } from "@/lib/db/schema";
import type { ListWithTasks } from "./board";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUiStore } from "@/stores/ui-store";
import {
  taskMatchesFilters,
  isFilteringActive,
} from "@/lib/utils/task-filters";
import { getRealtimeClientId } from "@/lib/realtime/client";

export function ListColumn({
  list,
  totalLists,
  allLists,
  role,
  currentUserId,
  onOpenTask,
  onRenamed,
  onDeleted,
  onMoved,
  onTaskCreated,
  onTaskCreateConfirmed,
  onTaskUpdated,
  onTaskArchived,
  onTaskDeleted,
  onTaskRestoreNeeded,
  onTaskMoved,
}: {
  list: ListWithTasks;
  totalLists: number;
  allLists: ListWithTasks[];
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  currentUserId: string;

  onRenamed?: (updated: List) => void;
  onDeleted?: (listId: string) => void;
  onMoved?: (updatedLists: List[]) => void;
  onTaskCreated?: (listId: string, task: Task) => void;
  onTaskCreateConfirmed?: (tempId: string, realTask: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (listId: string, taskId: string) => void;
  onTaskArchived?: (listId: string, taskId: string) => void;
  onTaskRestoreNeeded?: (task: Task) => void;
  onTaskMoved?: (task: Task, affectedTasks: Task[]) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canEdit = role !== "viewer" && role !== "contributor";
  const canContribute = role !== "viewer";
  const searchQuery = useUiStore((s) => s.searchQuery);
  const filterCompleted = useUiStore((s) => s.filterCompleted);
  const filterPriority = useUiStore((s) => s.filterPriority);
  const filterDueDate = useUiStore((s) => s.filterDueDate);
  const filterAssignedToMe = useUiStore((s) => s.filterAssignedToMe);
  const filterAssigneeId = useUiStore((s) => s.filterAssigneeId);

  const selectionMode = useUiStore((s) => s.selectionMode);
  const selectedTaskIds = useUiStore((s) => s.selectedTaskIds);
  const toggleTaskSelected = useUiStore((s) => s.toggleTaskSelected);

  const filters = useMemo(
    () => ({
      searchQuery,
      filterCompleted,
      filterPriority,
      filterDueDate,
      filterAssignedToMe,
      filterAssigneeId,
    }),
    [
      searchQuery,
      filterCompleted,
      filterPriority,
      filterDueDate,
      filterAssignedToMe,
      filterAssigneeId,
    ],
  );
  const filtering = isFilteringActive(filters);

  const visibleTasks = useMemo(
    () =>
      list.tasks.filter((task) =>
        taskMatchesFilters(task, filters, currentUserId),
      ),
    [list.tasks, filters, currentUserId],
  );

  const sortableTaskIds = useMemo(
    () => visibleTasks.map((t) => t.id),
    [visibleTasks],
  );

  const droppableData = useMemo(
    () => ({ type: "list-dropzone" as const, listId: list.id }),
    [list.id],
  );
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: list.id,
    data: droppableData,
  });

  const sortableData = useMemo(
    () => ({ type: "list" as const, listId: list.id }),
    [list.id],
  );
  const {
    attributes: listDragAttributes,
    listeners: listDragListeners,
    setNodeRef: setListSortableRef,
    transform: listTransform,
    transition: listTransition,
    isDragging: isListDragging,
  } = useSortable({
    id: `list-sort-${list.id}`,
    disabled: !canEdit,
    data: sortableData,
  });

  const listDragStyle = {
    transform: CSS.Transform.toString(listTransform),
    transition: listTransition,
  };

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === "" || name === list.name) {
      setIsRenaming(false);
      setName(list.name);
      return;
    }
    startTransition(async () => {
      const result = await updateList(list.id, { name }, getRealtimeClientId());
      if (!result.success) {
        toast({
          title: "Failed to rename list",
          description: result.error,
          variant: "destructive",
        });
        setName(list.name);
        setIsRenaming(false);
        return;
      }
      toast({ title: "List renamed", description: result.data?.name });
      setIsRenaming(false);
      onRenamed?.(result.data);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteList(list.id, getRealtimeClientId());
      if (result.success) {
        toast({
          title: "List deleted",
          description: `"${list.name}" was deleted.`,
        });
        setIsDeleteOpen(false);
        onDeleted?.(list.id);
      } else {
        toast({
          title: "Failed to delete list",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      {/* Outer wrapper with clean card background matching dark/light mode properly */}
      <div
        ref={setListSortableRef}
        style={listDragStyle}
        {...(canEdit ? listDragAttributes : {})}
        {...(canEdit ? listDragListeners : {})}
        className={`shrink-0 w-80 bg-card/90 backdrop-blur-md border border-border/85 rounded-3xl p-4 flex flex-col h-fit max-h-full transition-all cursor-grab active:cursor-grabbing shadow-xs ${
          isListDragging ? "opacity-40" : ""
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 px-1.5 shrink-0"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button, input, form")) {
              e.stopPropagation();
            }
          }}
        >
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex-1 mr-2">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleRenameSubmit}
                disabled={isPending}
                className="h-8 px-2.5 text-xs font-bold uppercase tracking-wider bg-background border-border text-foreground rounded-xl shadow-none focus-visible:ring-1"
              />
            </form>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                {list.name}
              </h3>
              <span className="text-[11px] text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
                {filtering
                  ? `${visibleTasks.length}/${list.tasks.length}`
                  : list.tasks.length}
              </span>
            </div>
          )}

          {!isRenaming && canEdit && (
            <ListActions
              listId={list.id}
              listName={list.name}
              currentPosition={list.position}
              totalLists={totalLists}
              onRename={() => {
                setName(list.name);
                setIsRenaming(true);
              }}
              onDelete={() => setIsDeleteOpen(true)}
              onMoved={onMoved}
            />
          )}
        </div>

        {/* Task Drop Zone Container */}
        <div
          ref={setDroppableRef}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex flex-col rounded-2xl transition-colors min-h-14 bg-transparent ${
            isOver ? "ring-2 ring-primary/40 bg-primary/10 p-1" : ""
          }`}
        >
          {/* Scrollable Tasks List with correct dark/light mode background behavior */}
          <div className="overflow-y-auto overflow-x-visible space-y-3 px-1 py-1 max-h-[calc(100vh-16rem)] bg-transparent">
            <SortableContext
              items={sortableTaskIds}
              strategy={verticalListSortingStrategy}
            >
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={list.projectId}
                  allLists={allLists}
                  canEdit={canEdit}
                  canContribute={canContribute}
                  dragDisabled={filtering || selectionMode}
                  selectionMode={selectionMode}
                  isSelected={selectedTaskIds.includes(task.id)}
                  onToggleSelected={() => toggleTaskSelected(task.id)}
                  onUpdated={onTaskUpdated}
                  onDeleted={() => onTaskDeleted?.(list.id, task.id)}
                  onDeleteFailed={onTaskRestoreNeeded}
                  onArchived={() => onTaskArchived?.(list.id, task.id)}
                  onMoved={(movedTask, affectedTasks) =>
                    onTaskMoved?.(movedTask, affectedTasks)
                  }
                  onOpenDetail={() => onOpenTask(task.id)}
                />
              ))}
            </SortableContext>
          </div>

          {canEdit && (
            <div className="pt-3 mt-2 shrink-0 bg-transparent">
              <CreateTaskModal
                listId={list.id}
                onCreated={(task) => onTaskCreated?.(list.id, task)}
                onConfirmed={(tempId, realTask) =>
                  onTaskCreateConfirmed?.(tempId, realTask)
                }
                onFailed={(tempId) => onTaskDeleted?.(list.id, tempId)}
              />
            </div>
          )}
        </div>
      </div>

      <DeleteListDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        listName={list.name}
        isPending={isPending}
      />
    </>
  );
}
