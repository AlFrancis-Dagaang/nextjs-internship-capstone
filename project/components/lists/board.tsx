"use client";

import { useEffect, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
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
import { deleteTask, moveTaskToList } from "@/lib/actions/tasks";
import { DeleteTaskDialog } from "@/components/tasks/modal/delete-task-dialog";
import { useUiStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";

export type TaskWithCommentCount = Task & { commentCount?: number };
export type ListWithTasks = List & { tasks: TaskWithCommentCount[] };

export function Board({
  projectId,
  initialLists,
}: {
  projectId: string;
  initialLists: ListWithTasks[];
}) {
  const { toast } = useToast();

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

  const [isDeletingTask, startDeleteTaskTransition] = useTransition();
  const replaceOptimisticTask = useBoardStore((s) => s.replaceOptimisticTask);

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

  const openTask =
    openTaskId != null
      ? (lists.flatMap((l) => l.tasks).find((t) => t.id === openTaskId) ?? null)
      : null;

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
    startDrag(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    dragOverAction(active.id as string, over.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable container pinned to the bottom */}
        <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-6">
          <div className="flex items-start space-x-6 min-w-max h-full px-1">
            {lists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                allLists={lists}
                totalLists={lists.length}
                onRenamed={renameList}
                onDeleted={removeList}
                onMoved={reorderLists}
                onTaskCreated={addTask}
                onTaskCreateConfirmed={replaceOptimisticTask}
                onTaskUpdated={updateTaskLocal}
                onTaskDeleted={handleTaskDeleted}
                onTaskRestoreNeeded={(task) =>
                  insertTaskAt(task.listId, task, task.position)
                }
                onTaskMoved={reconcileTaskMoved}
                onOpenTask={openTaskDetail}
              />
            ))}

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
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTask && (
        <TaskDetailModal
          task={openTask}
          projectId={projectId}
          allLists={lists}
          open={true}
          onOpenChange={(open) => {
            if (!open) closeTaskDetail();
          }}
          onChanged={updateTaskLocal}
          onMoved={reconcileTaskMoved}
          onDeleteClick={openDeleteTaskDialog}
          onArchive={() => {
            toast({ title: "Task archived", description: openTask.title });
          }}
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
