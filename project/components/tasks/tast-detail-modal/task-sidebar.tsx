"use client";

import type { Task } from "@/lib/db/schema";
import type {
  ListWithTasks,
  TaskWithCommentCount,
} from "@/components/lists/board";
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
  assignableUsers: { id: string; name?: string; email?: string }[];
  activityRefreshKey: number;
  canEdit: boolean;
  role: "owner" | "editor" | "viewer";
  onRestored?: () => void;
  onChanged?: (task: TaskWithCommentCount) => void;
  onMoved?: (task: Task, affectedTasks: Task[]) => void;
  onOpenChange: (open: boolean) => void;
  onDeleteClick?: () => void;
  onArchive?: () => void;
};

export function TaskSidebar({
  task,
  projectId,
  allLists,
  canEdit,
  onChanged,
  onMoved,
  onRestored,
  activityRefreshKey,
  onOpenChange,
  onDeleteClick,
  role,
  assignableUsers,
  onArchive,
}: TaskSidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-6 min-h-0 px-1">
        <TaskPrioritySection
          task={task}
          canEdit={canEdit}
          onChanged={onChanged}
        />

        <div className="border-t border-border">
          <TaskDatesSection
            task={task}
            canEdit={canEdit}
            onChanged={onChanged}
          />
        </div>

        {!task.isArchived && (
          <div className="border-t border-border">
            <TaskMoveSection
              task={task}
              canEdit={canEdit}
              allLists={allLists}
              onMoved={onMoved}
            />
          </div>
        )}

        <div className="border-t border-border">
          <TaskMembersSection
            task={task}
            projectId={projectId}
            canEdit={canEdit}
            assignableUsers={assignableUsers}
            onUpdated={onChanged}
            refreshKey={activityRefreshKey}
          />
        </div>

        <div className="border-t border-border">
          <h4 className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-2">
            Activity Log
          </h4>
          <TaskActivityFeed taskId={task.id} refreshKey={activityRefreshKey} />
        </div>
      </div>

      <div className="shrink-0 pt-3 mt-2 border-t border-border bg-muted/50">
        <TaskQuickActions
          task={task}
          onDeleteClick={onDeleteClick}
          onArchive={onArchive}
          canEdit={canEdit}
          role={role}
          onRestored={onRestored}
        />
      </div>
    </div>
  );
}
