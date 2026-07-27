"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-start space-x-6 min-w-max">
        {initialLists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            onChanged={() => router.refresh()}
          />
        ))}

        <div className="shrink-0 w-80">
          <AddListForm
            projectId={projectId}
            onCreated={() => router.refresh()}
          />
        </div>
      </div>
    </div>
  );
}
