"use client";

import { useState, useTransition } from "react";
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
import { Check } from "lucide-react";

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
  role: "owner" | "editor" | "viewer";
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
  const canEdit = role !== "viewer";

  // #70 item 5 — search & filter state, read from ui-store. Filtering is
  // pure client-side derivation over already-loaded board data.
  const searchQuery = useUiStore((s) => s.searchQuery);
  const filterCompleted = useUiStore((s) => s.filterCompleted);
  const filterPriority = useUiStore((s) => s.filterPriority);
  const filterDueDate = useUiStore((s) => s.filterDueDate);
  const filterAssignedToMe = useUiStore((s) => s.filterAssignedToMe);
  const filterAssigneeId = useUiStore((s) => s.filterAssigneeId);

  const selectionMode = useUiStore((s) => s.selectionMode);
  const selectedTaskIds = useUiStore((s) => s.selectedTaskIds);
  const toggleTaskSelected = useUiStore((s) => s.toggleTaskSelected);

  const filters = {
    searchQuery,
    filterCompleted,
    filterPriority,
    filterDueDate,
    filterAssignedToMe,
    filterAssigneeId,
  };
  const filtering = isFilteringActive(filters);

  const visibleTasks = list.tasks.filter((task) =>
    taskMatchesFilters(task, filters, currentUserId),
  );

  // 1. Droppable target ONLY for dropping tasks inside this list
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: list.id,
    data: { type: "list", listId: list.id },
  });

  // 2. Sortable target ONLY for moving the entire list column horizontally
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
    data: { type: "list", listId: list.id },
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
      const result = await updateList(list.id, { name });
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
      const result = await deleteList(list.id);
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
        className={`shrink-0 w-80 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 flex flex-col h-fit max-h-full transition-colors cursor-grab active:cursor-grabbing ${
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
                className="h-7 px-2 text-xs font-bold uppercase tracking-wider bg-white dark:bg-neutral-900 dark:border-neutral-700 rounded shadow-sm focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
              />
            </form>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                {list.name}
              </h3>
              <span className="text-xs text-neutral-500 font-semibold">
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
        {/* Task Drop Zone Container */}
        <div
          ref={setDroppableRef}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex flex-col rounded-lg transition-colors min-h-12.5 ${
            isOver
              ? "ring-2 ring-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10 p-1"
              : ""
          }`}
        >
          {/* Scrollable Tasks List — Added py-1.5 to prevent first/last card underlapping/clipping */}
          <div className="overflow-y-auto overflow-x-visible space-y-3 px-1.5 py-1.5 max-h-[calc(100vh-14rem)]">
            <SortableContext
              items={list.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={list.projectId}
                  allLists={allLists}
                  canEdit={canEdit}
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
