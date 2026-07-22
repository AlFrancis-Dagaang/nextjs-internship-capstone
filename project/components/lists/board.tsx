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
    <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400 p-6">
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {initialLists.length === 0 && (
          <p className="text-paynes_gray-500 dark:text-french_gray-400">
            No lists yet — add one to get started.
          </p>
        )}

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
