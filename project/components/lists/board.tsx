"use client";

import { useState } from "react";
import { ListColumn } from "./list-column";
import { AddListForm } from "./add-list-form";
import type { List, Task } from "@/lib/db/schema";

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
  }

  // Server now returns the full authoritative state for every list
  // touched by the move (source + destination), so we just replace
  // those lists' tasks directly — no optimistic guess, no reconcile
  // fetch needed.
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

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-start space-x-6 min-w-max">
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
          />
        ))}

        <div className="shrink-0 w-80">
          <AddListForm projectId={projectId} onCreated={handleListCreated} />
        </div>
      </div>
    </div>
  );
}
