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

  // Memoized so this object only gets a new reference when one of the
  // actual filter values changes — not on every render of ListColumn
  // (e.g. when an unrelated task in another list updates).
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

  // Stable ids for SortableContext — matches what's actually rendered
  // (visibleTasks), not the full unfiltered list.tasks. Keeping this in
  // sync with the rendered children avoids SortableContext's internal
  // index math getting out of sync when filters are active.
  const sortableTaskIds = useMemo(
    () => visibleTasks.map((t) => t.id),
    [visibleTasks],
  );

  // 1. Droppable target ONLY for dropping tasks inside this list
  // `data` is memoized so dnd-kit sees a stable reference across renders
  // that don't actually change list.id — an inline object literal here
  // was a new reference every render, which kept re-triggering dnd-kit's
  // internal registration effects and cascading into React's render loop.
  const droppableData = useMemo(
    () => ({ type: "list-dropzone" as const, listId: list.id }),
    [list.id],
  );
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: list.id,
    data: droppableData,
  });

  // 2. Sortable target ONLY for moving the entire list column horizontally
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
      {/* Outer wrapper handles ONLY column horizontal sorting */}
      <div
        ref={setListSortableRef}
        style={listDragStyle}
        {...(canEdit ? listDragAttributes : {})}
        {...(canEdit ? listDragListeners : {})}
        className={`shrink-0 w-80 bg-muted/60 border border-border rounded-xl p-3 flex flex-col h-fit max-h-full transition-colors cursor-grab active:cursor-grabbing shadow-sm ${
          isListDragging ? "opacity-40" : ""
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 px-1 shrink-0"
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
                className="h-7 px-2 text-xs font-bold uppercase tracking-wider bg-card border-border text-foreground rounded shadow-sm focus-visible:ring-1 focus-visible:ring-ring"
              />
            </form>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                {list.name}
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
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
          className={`flex flex-col rounded-lg transition-colors min-h-12.5 ${
            isOver ? "ring-2 ring-primary/40 bg-primary/10 p-1" : ""
          }`}
        >
          {/* Scrollable Tasks List — Added py-1.5 to prevent first/last card underlapping/clipping */}
          <div className="overflow-y-auto overflow-x-visible space-y-3 px-1.5 py-1.5 max-h-[calc(100vh-14rem)]">
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
