"use client";

import type { Task } from "@/lib/db/schema";
import type { ListWithTasks } from "@/components/lists/board";
import { TaskActivityFeed } from "./task-activity-feed";
import { TaskPrioritySection } from "./task-priority-section";
import { TaskDatesSection } from "./task-dates-section";
import { TaskMoveSection } from "./task-move-section";
import { TaskMembersSection } from "./task-members-section";
import { TaskQuickActions } from "./task-quick-actions";

type TaskSidebarProps = {
  task: Task;
  projectId: string;
  allLists: ListWithTasks[];
  onChanged?: (task: Task) => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  onOpenChange: (open: boolean) => void;
  onDeleteClick?: () => void;
  onArchive?: () => void;
};

export function TaskSidebar({
  task,
  projectId,
  allLists,
  onChanged,
  onMoved,
  onOpenChange,
  onDeleteClick,
  onArchive,
}: TaskSidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Added pt-2 and pb-6 so top inputs and bottom inputs never clip */}
      <div className="flex-1 overflow-y-auto space-y-4 pt-2 pr-1 pb-6 min-h-0">
        <TaskPrioritySection task={task} onChanged={onChanged} />
        <TaskDatesSection task={task} onChanged={onChanged} />

        <TaskMoveSection
          task={task}
          allLists={allLists}
          onMoved={onMoved}
          onOpenChange={onOpenChange}
        />

        <TaskMembersSection />

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <h4 className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider mb-2">
            Activity Log
          </h4>
          <TaskActivityFeed taskId={task.id} />
        </div>
      </div>

      {/* Pinned Quick Actions Footer */}
      <div className="shrink-0 pt-3 mt-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <TaskQuickActions
          task={task}
          onDeleteClick={onDeleteClick}
          onArchive={onArchive}
        />
      </div>
    </div>
  );
}
