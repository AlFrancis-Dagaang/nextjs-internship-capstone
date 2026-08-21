"use client";

import { useEffect, useState } from "react";
import { getTaskActivity } from "@/lib/actions/taskActivity";
import type { TaskActivity, User } from "@/lib/db/schema";
import {
  formatRelativeTime,
  getInitials,
  formatActivityLabel,
} from "@/lib/services/task-activity-helpers";
import { getAvatarColor } from "@/lib/utils/avatar";
import { TaskActivityModal } from "./task-activity-modal";

export type ActivityWithActor = TaskActivity & {
  actor?: Pick<User, "id" | "name">;
};

type TaskActivityFeedProps = {
  taskId: string;
  refreshKey?: number;
  previewCount?: number;
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
      <p className="text-destructive text-xs">
        Failed to load activity: {error}
      </p>
    );
  }

  if (activity === null) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: previewCount }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-6 w-6 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-2.5 w-1/3 rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="h-16 flex items-center">
        <p className="text-muted-foreground text-xs">No activity yet.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {activity.map((entry) => {
          const actorName = entry.actor?.name ?? "Unknown user";
          const stableColorKey = entry.actor?.id || actorName;
          return (
            <li key={entry.id} className="flex items-start gap-3">
              <div
                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-medium uppercase ring-2 ring-card shrink-0 shadow-2xs ${getAvatarColor(
                  stableColorKey,
                )}`}
              >
                {getInitials(actorName)}
              </div>
              <div className="flex-1 flex items-center justify-between gap-2 pt-0.5">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {actorName}
                  </span>{" "}
                  {formatActivityLabel(entry)}
                </span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          onClick={() => setShowAllOpen(true)}
          className="mt-2 text-xs text-primary hover:underline font-medium text-left cursor-pointer"
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
