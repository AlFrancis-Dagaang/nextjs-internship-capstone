"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatRelativeTime,
  getInitials,
  formatActivityLabel,
} from "@/lib/services/task-activity-helpers";
import type { ActivityWithActor } from "./task-activity-feed";

export function TaskActivityModal({
  activity,
  open,
  onOpenChange,
}: {
  activity: ActivityWithActor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity log</DialogTitle>
        </DialogHeader>

        <ul className="flex-1 overflow-y-auto space-y-4 pr-2">
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
      </DialogContent>
    </Dialog>
  );
}
