"use client";

import { useEffect, useState } from "react";
import { getTaskActivity } from "@/lib/actions/taskActivity";
import type { TaskActivity, User } from "@/lib/db/schema";
import {
  formatRelativeTime,
  getInitials,
  formatActivityLabel,
} from "@/lib/services/task-activity-helpers";
import { TaskActivityModal } from "./task-activity-modal";

export type ActivityWithActor = TaskActivity & {
  actor?: Pick<User, "id" | "name">;
};

type TaskActivityFeedProps = {
  taskId: string;
  refreshKey?: number;
  previewCount?: number; // how many entries to show inline, default 3
};

export function TaskActivityFeed({
  taskId,
  refreshKey,
  previewCount = 3,
}: TaskActivityFeedProps) {
  const [activity, setActivity] = useState<ActivityWithActor[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllOpen, setShowAllOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setActivity(null);
    setError(null);

    getTaskActivity(taskId, previewCount + 1).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      const data = result.data as ActivityWithActor[];
      setHasMore(data.length > previewCount);
      setActivity(data.slice(0, previewCount));
    });

    return () => {
      cancelled = true;
    };
  }, [taskId, refreshKey, previewCount]);

  if (error) {
    return (
      <p className="text-red-500 text-xs">Failed to load activity: {error}</p>
    );
  }

  if (activity === null) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: previewCount }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-6 w-6 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-2.5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="h-16 flex items-center">
        <p className="text-neutral-400 text-xs">No activity yet.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {activity.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3">
            <div className="h-6 w-6 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
              {entry.actor ? getInitials(entry.actor.name) : "?"}
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs text-neutral-600 dark:text-neutral-300">
                <span className="font-medium">
                  {entry.actor?.name ?? "Unknown user"}
                </span>{" "}
                {formatActivityLabel(entry)}
              </span>
              <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                {formatRelativeTime(entry.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={() => setShowAllOpen(true)}
          className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
        >
          See all activity
        </button>
      )}

      <TaskActivityModal
        taskId={taskId}
        open={showAllOpen}
        onOpenChange={setShowAllOpen}
      />
    </>
  );
}
