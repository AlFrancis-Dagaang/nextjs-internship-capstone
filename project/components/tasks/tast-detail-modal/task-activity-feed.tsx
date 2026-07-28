"use client";

import { useEffect, useState } from "react";
import { getTaskActivity } from "@/lib/actions/taskActivity";
import type { TaskActivity } from "@/lib/db/schema";

const ACTION_LABELS: Record<string, string> = {
  created: "created the task",
  updated: "updated the task",
  moved: "moved the task",
  priority_changed: "changed the priority",
  due_date_changed: "changed the due date",
  assignee_changed: "changed the assignee",
  description_changed: "changed the description",
  comment_added: "added a comment",
  comment_deleted: "deleted a comment",
  archived: "archived the task",
  restored: "restored the task",
  deleted: "deleted the task",
};

// Simplified relative time formatter to match "2 hours ago" from mockup
function formatRelativeTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

type TaskActivityFeedProps = {
  taskId: string;
  refreshKey?: number;
};

export function TaskActivityFeed({
  taskId,
  refreshKey,
}: TaskActivityFeedProps) {
  const [activity, setActivity] = useState<TaskActivity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setActivity(null);
    setError(null);

    getTaskActivity(taskId).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      setActivity(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [taskId, refreshKey]);

  if (error) {
    return (
      <p className="text-red-500 text-xs">Failed to load activity: {error}</p>
    );
  }
  if (activity === null) {
    return (
      <div className="h-[140px] flex items-center">
        <p className="text-neutral-400 text-xs animate-pulse">
          Loading activity…
        </p>
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="h-[140px] flex items-center">
        <p className="text-neutral-400 text-xs">No activity yet.</p>
      </div>
    );
  }

  return (
    <ul className="h-[140px] space-y-4 overflow-y-auto pr-2">
      {activity.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3">
          <div className="h-6 w-6 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
            JD
          </div>
          <div className="flex-1 flex items-center justify-between gap-2 pt-0.5">
            <span className="text-xs text-neutral-600 dark:text-neutral-300">
              {entry.action === "moved" && entry.metadata
                ? `Moved from ${(entry.metadata as any).fromListName} to ${(entry.metadata as any).toListName}`
                : (ACTION_LABELS[entry.action] ?? entry.action)}
            </span>
            <span className="text-[10px] text-neutral-400 whitespace-nowrap">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
