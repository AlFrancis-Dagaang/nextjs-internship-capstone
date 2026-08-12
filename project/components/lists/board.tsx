"use client";

import { useEffect, useState, useTransition } from "react";
import {
  type CollisionDetection,
  DndContext,
  DragOverlay,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ListColumn } from "./list-column";
import { TaskCardView } from "@/components/tasks/task-card";
import { AddListForm } from "./add-list-form";
import type { List, Task } from "@/lib/db/schema";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailModal } from "@/components/tasks/modal/task-detail-modal";
import { deleteTask, moveTaskToList, archiveTask } from "@/lib/actions/tasks";
import { DeleteTaskDialog } from "@/components/tasks/modal/delete-task-dialog";
import { useUiStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { useTrackProjectView } from "@/hooks/use-track-project-view";
import { getAssignableUsers } from "@/lib/actions/project-member";
import { moveList } from "@/lib/actions/lists";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSearchParams } from "next/navigation";

export type TaskWithCommentCount = Task & {
  commentCount?: number;
  assignees?: { userId: string; name?: string; email?: string }[];
};
export type ListWithTasks = List & { tasks: TaskWithCommentCount[] };

export function Board({
  projectId,
  initialLists,
  role,
  currentUserId,
}: {
  projectId: string;
  initialLists: ListWithTasks[];
  role: "owner" | "editor" | "viewer";
  currentUserId: string;
}) {
  const { toast } = useToast();
  useTrackProjectView(projectId);
  // #22 (pass 2) — lists/drag state now live in board-store.ts.
  const lists = useBoardStore((s) => s.lists);
  const activeTask = useBoardStore((s) => s.activeTask);
  const setInitialLists = useBoardStore((s) => s.setInitialLists);
  const addList = useBoardStore((s) => s.addList);
  const renameList = useBoardStore((s) => s.renameList);
  const removeList = useBoardStore((s) => s.removeList);
  const reorderLists = useBoardStore((s) => s.reorderLists);
  const addTask = useBoardStore((s) => s.addTask);
  const insertTaskAt = useBoardStore((s) => s.insertTaskAt);
  const updateTaskLocal = useBoardStore((s) => s.updateTaskLocal);
  const removeTask = useBoardStore((s) => s.removeTask);
  const reconcileTaskMoved = useBoardStore((s) => s.reconcileTaskMoved);
  const changeCommentCount = useBoardStore((s) => s.changeCommentCount);
  const startDrag = useBoardStore((s) => s.startDrag);
  const clearActiveTask = useBoardStore((s) => s.clearActiveTask);
  const dragOverAction = useBoardStore((s) => s.dragOver);
  const endDragAction = useBoardStore((s) => s.endDrag);
  const revertToSnapshot = useBoardStore((s) => s.revertToSnapshot);

  // #22 (pass 1) — openTaskId/deleteTaskOpen live in ui-store.ts.
  const openTaskId = useUiStore((s) => s.openTaskId);
  const deleteTaskOpen = useUiStore((s) => s.deleteTaskOpen);
  const openTaskDetail = useUiStore((s) => s.openTaskDetail);
  const closeTaskDetail = useUiStore((s) => s.closeTaskDetail);
  const openDeleteTaskDialog = useUiStore((s) => s.openDeleteTaskDialog);
  const closeDeleteTaskDialog = useUiStore((s) => s.closeDeleteTaskDialog);

  const selectionMode = useUiStore((s) => s.selectionMode);
  const selectedTaskIds = useUiStore((s) => s.selectedTaskIds);
  const exitSelectionMode = useUiStore((s) => s.exitSelectionMode);
  const selectAllVisible = useUiStore((s) => s.selectAllVisible);
  const requestBulkDelete = useUiStore((s) => s.requestBulkDelete);

  const [isDeletingTask, startDeleteTaskTransition] = useTransition();
  const replaceOptimisticTask = useBoardStore((s) => s.replaceOptimisticTask);

  const activeListId = useBoardStore((s) => s.activeListId);
  const startListDrag = useBoardStore((s) => s.startListDrag);
  const clearActiveList = useBoardStore((s) => s.clearActiveList);
  const dragListOver = useBoardStore((s) => s.dragListOver);
  const endListDrag = useBoardStore((s) => s.endListDrag);
  const revertListSnapshot = useBoardStore((s) => s.revertListSnapshot);

  const searchParams = useSearchParams();
  const openTaskParam = searchParams.get("openTask");

  // Auto-open task from notification search param once on mount
  useEffect(() => {
    if (openTaskParam) {
      openTaskDetail(openTaskParam);
    }
  }, [openTaskParam, openTaskDetail]);

  const [assignableUsers, setAssignableUsers] = useState<
    { id: string; name?: string; email?: string }[]
  >([]);

  useEffect(() => {
    getAssignableUsers(projectId).then((result) => {
      if (result.success) setAssignableUsers(result.data);
    });
  }, [projectId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "Escape") {
        if (selectionMode) exitSelectionMode();
        return;
      }

      if (!selectionMode || isTyping) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedTaskIds.length > 0) {
          e.preventDefault();
          requestBulkDelete();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const allTaskIds = lists.flatMap((l) => l.tasks.map((t) => t.id));
        selectAllVisible(allTaskIds);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectionMode,
    selectedTaskIds,
    lists,
    exitSelectionMode,
    selectAllVisible,
    requestBulkDelete,
  ]);

  // Hydrate the store from server-provided data. Re-runs if projectId
  // changes (e.g. client-side nav to a different project) so stale data
  // from a previous board doesn't linger in this global store instance.
  useEffect(() => {
    setInitialLists(initialLists);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const [openTask, setOpenTask] = useState<TaskWithCommentCount | null>(null);

  useEffect(() => {
    if (openTaskId == null) {
      setOpenTask(null);
      return;
    }
    const found = lists
      .flatMap((l) => l.tasks)
      .find((t) => t.id === openTaskId);
    if (found) {
      setOpenTask(found);
    }
    // If not found (e.g. archived while open), intentionally keep the
    // last-known snapshot instead of clearing it — that's what lets the
    // modal stay open after archiving, showing the task as it was right
    // before archive, until the user explicitly closes it.
  }, [openTaskId, lists]);

  // Type the function using dnd-kit's built-in CollisionDetection type
  const customCollisionDetection: CollisionDetection = (args) => {
    const isDraggingList = args.active.data.current?.type === "list";

    if (isDraggingList) {
      // When dragging a list, only look for intersections with other list sortables
      return rectIntersection({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container) => container.data.current?.type === "list",
        ),
      });
    }

    // Default behavior for tasks
    return rectIntersection(args);
  };

  function handleTaskDeleted(listId: string, taskId: string) {
    removeTask(listId, taskId);
    if (openTaskId === taskId) closeTaskDetail();
  }

  function handleConfirmDeleteTask() {
    if (!openTask) return;
    startDeleteTaskTransition(async () => {
      const result = await deleteTask(openTask.id);
      if (result.success) {
        toast({
          title: "Task deleted",
          description: `"${openTask.title}" was deleted.`,
        });
        handleTaskDeleted(openTask.listId, openTask.id);
        closeTaskDetail();
      } else {
        toast({
          title: "Failed to delete task",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }
  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type;
    if (type === "list") {
      const listId = event.active.data.current?.listId as string;
      startListDrag(listId);
    } else {
      startDrag(event.active.id as string);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === "list") {
      dragListOver(active.id as string, over.id as string);
    } else {
      dragOverAction(active.id as string, over.id as string);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.data.current?.type === "list") {
      clearActiveList();
      if (!over) return;
      const result = endListDrag(active.id as string, over.id as string);
      if (!result) return;

      moveList(result.listId, result.finalPosition).then((res) => {
        if (res.success) {
          reorderLists(res.data);
        } else {
          revertListSnapshot();
          toast({
            title: "Failed to move list",
            description: res.error,
            variant: "destructive",
          });
        }
      });
      return;
    }

    clearActiveTask();
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const result = endDragAction(activeId, overId);
    if (!result) return;

    moveTaskToList(activeId, result.finalListId, result.finalPosition).then(
      (res) => {
        if (res.success) {
          reconcileTaskMoved(res.data.movedTask, res.data.affectedTasks);
        } else {
          revertToSnapshot();
          toast({
            title: "Failed to move task",
            description: res.error,
            variant: "destructive",
          });
        }
      },
    );
  }

  function handleTaskArchived(listId: string, taskId: string) {
    removeTask(listId, taskId);
    if (openTaskId === taskId) closeTaskDetail();
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={customCollisionDetection} // <-- Replace rectIntersection with this
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable container pinned to the bottom */}
        <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-6">
          <div className="flex items-start space-x-6 min-w-max h-full px-1">
            <SortableContext
              items={lists.map((l) => `list-sort-${l.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  allLists={lists}
                  totalLists={lists.length}
                  role={role}
                  currentUserId={currentUserId}
                  onRenamed={renameList}
                  onDeleted={removeList}
                  onMoved={reorderLists}
                  onTaskCreated={addTask}
                  onTaskCreateConfirmed={replaceOptimisticTask}
                  onTaskUpdated={updateTaskLocal}
                  onTaskDeleted={handleTaskDeleted}
                  onTaskArchived={handleTaskArchived}
                  onTaskRestoreNeeded={(task) =>
                    insertTaskAt(task.listId, task, task.position)
                  }
                  onTaskMoved={reconcileTaskMoved}
                  onOpenTask={openTaskDetail}
                />
              ))}
            </SortableContext>

            <div className="shrink-0 w-80">
              <AddListForm projectId={projectId} onCreated={addList} />
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="w-72 rotate-2">
              <TaskCardView
                task={activeTask}
                interactive={false}
                className="shadow-lg cursor-grabbing"
              />
            </div>
          ) : activeListId ? (
            (() => {
              const draggedList = lists.find((l) => l.id === activeListId);
              if (!draggedList) return null;
              return (
                <div className="w-80 rotate-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-2xl p-3 opacity-95 flex flex-col max-h-[80vh]">
                  {/* List Header Preview */}
                  <div className="flex items-center justify-between pb-3 px-1 shrink-0">
                    <span className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      {draggedList.name}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold">
                      {draggedList.tasks.length}
                    </span>
                  </div>
                  {/* Tasks Preview Container */}
                  <div className="space-y-3 overflow-hidden pr-1">
                    {draggedList.tasks.map((task) => (
                      <TaskCardView
                        key={task.id}
                        task={task}
                        interactive={false}
                        className="shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTask && (
        <TaskDetailModal
          task={openTask}
          projectId={projectId}
          allLists={lists}
          assignableUsers={assignableUsers}
          role={role}
          open={true}
          onOpenChange={(open) => {
            if (!open) closeTaskDetail();
          }}
          onChanged={updateTaskLocal}
          onMoved={reconcileTaskMoved}
          onDeleteClick={openDeleteTaskDialog}
          onCommentCountChanged={changeCommentCount}
        />
      )}

      {openTask && (
        <DeleteTaskDialog
          isOpen={deleteTaskOpen}
          onClose={closeDeleteTaskDialog}
          onConfirm={handleConfirmDeleteTask}
          taskTitle={openTask.title}
          isPending={isDeletingTask}
        />
      )}
    </div>
  );
}
