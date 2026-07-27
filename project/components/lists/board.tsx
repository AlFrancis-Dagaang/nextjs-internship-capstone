"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListColumn } from "./list-column";
import { AddListForm } from "./add-list-form";
import { getListsByProject } from "@/lib/actions/lists";
import type { List, Task } from "@/lib/db/schema";

export type ListWithTasks = List & { tasks: Task[] };

export function Board({
  projectId,
  initialLists,
}: {
  projectId: string;
  initialLists: ListWithTasks[];
}) {
  const router = useRouter();
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

  // Move can shift multiple lists' positions at once (see moveList's
  // reindexing), so a single-field local patch isn't reliable here.
  // Re-fetching just the lists (no task data) and merging with the tasks
  // already in state is still far cheaper than a full router.refresh().
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

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-start space-x-6 min-w-max">
        {lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            onChanged={() => router.refresh()}
            onRenamed={handleListRenamed}
            onDeleted={handleListDeleted}
            onMoved={handleListMoved}
          />
        ))}

        <div className="shrink-0 w-80">
          <AddListForm projectId={projectId} onCreated={handleListCreated} />
        </div>
      </div>
    </div>
  );
}
