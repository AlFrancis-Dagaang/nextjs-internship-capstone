"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTaskActivity } from "@/lib/actions/taskActivity";
import {
  formatRelativeTime,
  getInitials,
  formatActivityLabel,
  ACTION_LABELS,
} from "@/lib/services/task-activity-helpers";
import type { ActivityWithActor } from "./task-activity-feed";

export function TaskActivityModal({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activity, setActivity] = useState<ActivityWithActor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setActivity(null);
    setError(null);
    setNameQuery("");
    setActionFilter("all");

    getTaskActivity(taskId).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      setActivity(result.data as ActivityWithActor[]);
    });

    return () => {
      cancelled = true;
    };
  }, [taskId, open]);

  const filteredActivity = useMemo(() => {
    if (!activity) return [];
    const q = nameQuery.trim().toLowerCase();
    return activity.filter((entry) => {
      const matchesName = q
        ? (entry.actor?.name ?? "").toLowerCase().includes(q)
        : true;
      const matchesAction =
        actionFilter === "all" ? true : entry.action === actionFilter;
      return matchesName && matchesAction;
    });
  }, [activity, nameQuery, actionFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity log</DialogTitle>
        </DialogHeader>

        {activity !== null && activity.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <Input
              placeholder="Search by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-8 text-xs w-40 shrink-0">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All actions
                </SelectItem>
                {Object.entries(ACTION_LABELS).map(([action, label]) => (
                  <SelectItem key={action} value={action} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs">
            Failed to load activity: {error}
          </p>
        )}

        {activity === null && !error && (
          <ul className="space-y-4 pr-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-6 w-6 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-2.5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {activity !== null && filteredActivity.length === 0 && (
          <p className="text-neutral-400 text-xs py-6 text-center">
            {activity.length === 0
              ? "No activity yet."
              : "No matching activity."}
          </p>
        )}

        {activity !== null && filteredActivity.length > 0 && (
          <ul className="flex-1 overflow-y-auto space-y-4 pr-2">
            {filteredActivity.map((entry) => (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
