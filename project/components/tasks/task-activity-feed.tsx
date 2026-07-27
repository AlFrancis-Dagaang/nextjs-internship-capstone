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

function formatTimestamp(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type TaskActivityFeedProps = {
  taskId: string;
  /** Bump this to force a re-fetch (e.g. after a save) without remounting. */
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
      <p className="text-destructive text-xs">
        Failed to load activity: {error}
      </p>
    );
  }

  if (activity === null) {
    return <p className="text-muted-foreground text-xs">Loading activity…</p>;
  }

  if (activity.length === 0) {
    return <p className="text-muted-foreground text-xs">No activity yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {activity.map((entry) => (
        <li key={entry.id} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {entry.action === "moved" && entry.metadata
              ? `moved from ${(entry.metadata as any).fromListName} to ${(entry.metadata as any).toListName}`
              : (ACTION_LABELS[entry.action] ?? entry.action)}
          </span>{" "}
          · {formatTimestamp(entry.createdAt)}
        </li>
      ))}
    </ul>
  );
}
