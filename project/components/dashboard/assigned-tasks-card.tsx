// components/dashboard/assigned-tasks-card.tsx
"use client";

import Link from "next/link";
import { CheckSquare, ArrowUpRight } from "lucide-react";

type AssignedTaskDTO = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string | null;
  projectId: string;
  projectName: string;
  listId: string;
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

function getPriorityBadgeClass(priority: string | null | undefined): string {
  if (!priority)
    return "bg-secondary text-secondary-foreground border-border/80";
  const normalized = priority.toLowerCase();
  return (
    priorityColors[normalized] ||
    "bg-secondary text-secondary-foreground border-border/80"
  );
}

export function AssignedTasksCard({
  assignedTasks,
}: {
  assignedTasks: AssignedTaskDTO[];
}) {
  const maxAssignedTasks = 4;
  const displayedAssignedTasks = assignedTasks.slice(0, maxAssignedTasks);
  const remainingAssignedCount = assignedTasks.length - maxAssignedTasks;

  return (
    <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full md:col-span-2 lg:col-span-1">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <CheckSquare size={15} className="text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Assigned to Me
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
            {assignedTasks.length}
          </span>
        </div>

        {assignedTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs font-semibold text-foreground">
              Nothing assigned to you right now
            </p>
            <p className="text-[11px] mt-0.5">
              Tasks assigned across your projects will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedAssignedTasks.map((task) => {
              const priorityClass = getPriorityBadgeClass(task.priority);
              return (
                <div
                  key={task.id}
                  className="p-3 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between space-y-1.5 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      {task.title}
                    </span>
                    {task.priority && (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${priorityClass}`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40 gap-2">
                    <Link
                      href={`/projects/${task.projectId}`}
                      className="text-muted-foreground hover:text-foreground font-medium truncate"
                    >
                      {task.projectName}
                    </Link>
                    {task.dueDate && (
                      <span className="text-muted-foreground shrink-0">
                        Due{" "}
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {remainingAssignedCount > 0 && (
              <div className="text-center pt-1">
                <span className="text-xs text-muted-foreground font-medium">
                  +{remainingAssignedCount} more assigned task
                  {remainingAssignedCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
        <Link
          href="/my-tasks"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>View All Tasks</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
