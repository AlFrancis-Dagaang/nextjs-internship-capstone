"use client";

import { useState, useRef } from "react";
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
import { arrayMove } from "@dnd-kit/sortable";
import { ListColumn } from "./list-column";
import { TaskCardView } from "@/components/tasks/task-card";
import { AddListForm } from "./add-list-form";
import type { List, Task } from "@/lib/db/schema";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailModal } from "@/components/tasks/modal/task-detail-modal";
import { deleteTask, moveTaskToList } from "@/lib/actions/tasks";
import { useUiStore } from "@/stores/ui-store";
import { DeleteTaskDialog } from "@/components/tasks/modal/delete-task-dialog";
import { useTransition } from "react";

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
  const [lists, setLists] = useState<ListWithTasks[]>(initialLists);

  // #22 (pass 1) — openTaskId/deleteTaskOpen moved to ui-store.ts.
  const openTaskId = useUiStore((s) => s.openTaskId);
  const deleteTaskOpen = useUiStore((s) => s.deleteTaskOpen);
  const openTaskDetail = useUiStore((s) => s.openTaskDetail);
  const closeTaskDetail = useUiStore((s) => s.closeTaskDetail);
  const openDeleteTaskDialog = useUiStore((s) => s.openDeleteTaskDialog);
  const closeDeleteTaskDialog = useUiStore((s) => s.closeDeleteTaskDialog);
  const [isDeletingTask, startDeleteTaskTransition] = useTransition();

  // #21 — drag-and-drop state. Reorder/move happens entirely client-side;
  // persisting the resulting `position` values to the DB is #24's job.
  const [activeTask, setActiveTask] = useState<TaskWithCommentCount | null>(
    null,
  );
  // #24 — snapshot of `lists` taken at drag start, used to revert the
  // optimistic update if the persist call to moveTaskToList fails.
  const dragSnapshotRef = useRef<ListWithTasks[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Requires the pointer to move 5px before a drag starts, so a plain
      // click still reaches TaskCard's onClick (opens the detail modal)
      // instead of being swallowed as a drag.
      activationConstraint: { distance: 5 },
    }),
  );

  const openTask =
    openTaskId != null
      ? (lists.flatMap((l) => l.tasks).find((t) => t.id === openTaskId) ?? null)
      : null;

  function handleListCreated(newList: List) {
    setLists((prev) => [...prev, { ...newList, tasks: [] }]);
  }

  function handleListRenamed(updated: List) {
    setLists((prev) =>
      prev.map((l) => (l.id === updated.id ? { ...l, name: updated.name } : l)),
    );
  }

  function handleListDeleted(listId: string) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  function handleListMoved(updatedLists: List[]) {
    setLists((prev) => {
      const taskMap = new Map(prev.map((l) => [l.id, l.tasks]));
      return updatedLists
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ ...l, tasks: taskMap.get(l.id) ?? [] }));
    });
  }

  function handleTaskCreated(listId: string, task: Task) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l,
      ),
    );
  }

  function handleTaskUpdated(task: Task) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === task.listId
          ? {
              ...l,
              // updateTask's return value is a plain Task — no
              // commentCount, since that's a client-only field. Preserve
              // it from the existing card instead of letting it default
              // away to 0.
              tasks: l.tasks.map((t) =>
                t.id === task.id
                  ? { ...task, commentCount: t.commentCount }
                  : t,
              ),
            }
          : l,
      ),
    );
  }

  function handleTaskDeleted(listId: string, taskId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
          : l,
      ),
    );
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

  function handleTaskMoved(movedTask: Task, affectedTasks: Task[]) {
    setLists((prev) => {
      // affectedTasks comes straight from the DB (moveTaskToList) and has
      // no `commentCount` — that field is client-only. Look it up from the
      // current state before overwriting, or it silently resets to 0.
      const commentCountMap = new Map(
        prev.flatMap((l) => l.tasks).map((t) => [t.id, t.commentCount]),
      );
      const affectedListIds = new Set(affectedTasks.map((t) => t.listId));

      return prev.map((l) => {
        if (!affectedListIds.has(l.id)) return l;

        const tasksForThisList = affectedTasks
          .filter((t) => t.listId === l.id)
          .sort((a, b) => a.position - b.position)
          .map((t) => ({ ...t, commentCount: commentCountMap.get(t.id) }));

        return { ...l, tasks: tasksForThisList };
      });
    });
  }
  function handleTaskCommentCountChanged(taskId: string, delta: number) {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId
            ? { ...t, commentCount: Math.max(0, (t.commentCount ?? 0) + delta) }
            : t,
        ),
      })),
    );
  }

  // ---- #21 drag-and-drop helpers ----

  function findListByTaskId(taskId: string): ListWithTasks | undefined {
    return lists.find((l) => l.tasks.some((t) => t.id === taskId));
  }

  function findListById(id: string): ListWithTasks | undefined {
    return lists.find((l) => l.id === id);
  }

  function handleDragStart(event: DragStartEvent) {
    dragSnapshotRef.current = lists;
    const task = lists
      .flatMap((l) => l.tasks)
      .find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  // Live-move the card between columns while dragging over a different list,
  // so the layout updates as you drag (standard dnd-kit multi-container
  // pattern) rather than only snapping into place on drop.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const sourceList = findListByTaskId(activeId);
    // `over` can be either a task id (dragging over a card) or a list id
    // (dragging over an empty/near-empty column's droppable area).
    const destList = findListByTaskId(overId) ?? findListById(overId);
    if (!sourceList || !destList || sourceList.id === destList.id) return;

    setLists((prev) => {
      const source = prev.find((l) => l.id === sourceList.id);
      const dest = prev.find((l) => l.id === destList.id);
      if (!source || !dest) return prev;

      const task = source.tasks.find((t) => t.id === activeId);
      if (!task) return prev;

      const overTaskIndex = dest.tasks.findIndex((t) => t.id === overId);
      const insertIndex =
        overTaskIndex >= 0 ? overTaskIndex : dest.tasks.length;

      const movedTask = { ...task, listId: dest.id };

      return prev.map((l) => {
        if (l.id === source.id) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== activeId) };
        }
        if (l.id === dest.id) {
          const newTasks = [...l.tasks];
          newTasks.splice(insertIndex, 0, movedTask);
          return { ...l, tasks: newTasks };
        }
        return l;
      });
    });
  }

  // Finalize same-column reordering, apply it optimistically, then persist
  // to the DB via moveTaskToList — reconciling with its authoritative
  // movedTask/affectedTasks on success, or reverting to the pre-drag
  // snapshot and toasting on failure.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Read from `lists` directly (current render's state, already reflects
    // any cross-column move handleDragOver made) rather than from inside
    // the setLists updater below — that updater isn't guaranteed to run
    // synchronously, so values captured there aren't safe to read right
    // after the call.
    const list = lists.find((l) => l.tasks.some((t) => t.id === activeId));
    if (!list) return;

    const oldIndex = list.tasks.findIndex((t) => t.id === activeId);
    const newIndex = list.tasks.findIndex((t) => t.id === overId);

    const reordered =
      oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex
        ? arrayMove(list.tasks, oldIndex, newIndex)
        : list.tasks;

    const finalListId = list.id;
    const finalPosition = reordered.findIndex((t) => t.id === activeId);

    setLists((prev) =>
      prev.map((l) =>
        l.id === list.id
          ? { ...l, tasks: reordered.map((t, i) => ({ ...t, position: i })) }
          : l,
      ),
    );

    moveTaskToList(activeId, finalListId, finalPosition).then((result) => {
      if (result.success) {
        handleTaskMoved(result.data.movedTask, result.data.affectedTasks);
      } else {
        if (snapshot) setLists(snapshot);
        toast({
          title: "Failed to move task",
          description: result.error,
          variant: "destructive",
        });
      }
    });
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
                onRenamed={handleListRenamed}
                onDeleted={handleListDeleted}
                onMoved={handleListMoved}
                onTaskCreated={handleTaskCreated}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onTaskMoved={handleTaskMoved}
                onOpenTask={openTaskDetail}
              />
            ))}

            <div className="shrink-0 w-80">
              <AddListForm
                projectId={projectId}
                onCreated={handleListCreated}
              />
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
          onChanged={handleTaskUpdated}
          onMoved={handleTaskMoved}
          onDeleteClick={openDeleteTaskDialog}
          onArchive={() => {
            toast({ title: "Task archived", description: openTask.title });
          }}
          onCommentCountChanged={handleTaskCommentCountChanged}
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
