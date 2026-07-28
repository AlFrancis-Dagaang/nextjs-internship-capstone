"use client";

import { useState } from "react";
import { ListColumn } from "./list-column";
import { AddListForm } from "./add-list-form";
import { getListsByProject } from "@/lib/actions/lists";
import type { List, Task } from "@/lib/db/schema";
import { getTasksByList } from "@/lib/actions/tasks"; // <-- add this import

export type ListWithTasks = List & { tasks: Task[] };

export function Board({
  projectId,
  initialLists,
}: {
  projectId: string;
  initialLists: ListWithTasks[];
}) {
  const [lists, setLists] = useState<ListWithTasks[]>(initialLists);

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

  function handleListMoved() {
    getListsByProject(projectId).then((result) => {
      if (!result.success) return;
      setLists((prev) => {
        const taskMap = new Map(prev.map((l) => [l.id, l.tasks]));
        return result.data
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((l) => ({ ...l, tasks: taskMap.get(l.id) ?? [] }));
      });
    });
  }

  // --- Task handlers: patch state directly, no router.refresh() ---

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
  }

  // For cross-list moves, easiest correct fix is to remove from old list
  // and push into new list (position ordering can refine later).
  // board.tsx

  function handleTaskMoved(movedTask: Task) {
    let sourceListId: string | undefined;

    setLists((prev) => {
      sourceListId = prev.find((l) =>
        l.tasks.some((t) => t.id === movedTask.id),
      )?.id;

      // optimistic update so the UI feels instant
      const withoutTask = prev.map((l) => ({
        ...l,
        tasks: l.tasks.filter((t) => t.id !== movedTask.id),
      }));

      return withoutTask.map((l) =>
        l.id === movedTask.listId
          ? {
              ...l,
              tasks: [...l.tasks, movedTask].sort(
                (a, b) => a.position - b.position,
              ),
            }
          : l,
      );
    });

    // reconcile: refetch the real position order for both affected lists
    const listsToSync = new Set(
      [movedTask.listId, sourceListId].filter(Boolean) as string[],
    );

    listsToSync.forEach((listId) => {
      getTasksByList(listId).then((result) => {
        if (!result.success) return;
        setLists((current) =>
          current.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  tasks: result.data
                    .slice()
                    .sort((a, b) => a.position - b.position),
                }
              : l,
          ),
        );
      });
    });
  }
  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-start space-x-6 min-w-max">
        {lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            onRenamed={handleListRenamed}
            onDeleted={handleListDeleted}
            onMoved={handleListMoved}
            onTaskCreated={handleTaskCreated}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onTaskMoved={handleTaskMoved}
          />
        ))}

        <div className="shrink-0 w-80">
          <AddListForm projectId={projectId} onCreated={handleListCreated} />
        </div>
      </div>
    </div>
  );
}
