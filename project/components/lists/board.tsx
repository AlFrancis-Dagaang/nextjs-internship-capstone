"use client";

import { useState } from "react";
import { ListColumn } from "./list-column";
import { AddListForm } from "./add-list-form";
import type { List, Task } from "@/lib/db/schema";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailModal } from "@/components/tasks/modal/task-detail-modal";
import { deleteTask } from "@/lib/actions/tasks";
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
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [isDeletingTask, startDeleteTaskTransition] = useTransition();

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
          ? { ...l, tasks: l.tasks.map((t) => (t.id === task.id ? task : t)) }
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
    if (openTaskId === taskId) setOpenTaskId(null);
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
        setDeleteTaskOpen(false);
        setOpenTaskId(null);
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
      const affectedListIds = new Set(affectedTasks.map((t) => t.listId));

      return prev.map((l) => {
        if (!affectedListIds.has(l.id)) return l;

        const tasksForThisList = affectedTasks
          .filter((t) => t.listId === l.id)
          .sort((a, b) => a.position - b.position);

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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
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
              onOpenTask={setOpenTaskId}
            />
          ))}

          <div className="shrink-0 w-80">
            <AddListForm projectId={projectId} onCreated={handleListCreated} />
          </div>
        </div>
      </div>

      {openTask && (
        <TaskDetailModal
          task={openTask}
          projectId={projectId}
          allLists={lists}
          open={true}
          onOpenChange={(open) => {
            if (!open) setOpenTaskId(null);
          }}
          onChanged={handleTaskUpdated}
          onMoved={handleTaskMoved}
          onDeleteClick={() => setDeleteTaskOpen(true)}
          onArchive={() => {
            toast({ title: "Task archived", description: openTask.title });
          }}
          onCommentCountChanged={handleTaskCommentCountChanged}
        />
      )}

      {openTask && (
        <DeleteTaskDialog
          isOpen={deleteTaskOpen}
          onClose={() => setDeleteTaskOpen(false)}
          onConfirm={handleConfirmDeleteTask}
          taskTitle={openTask.title}
          isPending={isDeletingTask}
        />
      )}
    </div>
  );
}
