"use client";

import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";
import type { ListWithTasks } from "./board";

export function ListColumn({
  list,
  onChanged,
}: {
  list: ListWithTasks;
  onChanged?: () => void;
}) {
  return (
    <div className="shrink-0 w-80">
      <div className="bg-white dark:bg-outer_space-400 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400">
        <div className="p-4 border-b border-french_gray-300 dark:border-paynes_gray-400">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500">
              {list.name}
              <span className="ml-2 px-2 py-1 text-xs bg-french_gray-300 dark:bg-paynes_gray-400 rounded-full">
                {list.tasks.length}
              </span>
            </h3>
          </div>
        </div>

        <div className="p-4 space-y-3 min-h-100">
          {list.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          <CreateTaskModal listId={list.id} onCreated={onChanged} />
        </div>
      </div>
    </div>
  );
}
