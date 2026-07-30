"use client";

import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Task } from "@/lib/db/schema";

export function TaskQuickActions({
  task,
  onArchive,
  onDeleteClick,
}: {
  task: Task;
  onArchive?: () => void;
  onDeleteClick?: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Quick Actions
      </Label>
      <div className="flex flex-col gap-2">
        {/* Archive Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-950"
          onClick={onArchive}
          type="button"
        >
          <Archive className="w-4 h-4 mr-2 text-neutral-400" />
          Archive task
        </Button>

        {/* Delete Button - Triggers DeleteTaskDialog */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 bg-white dark:bg-neutral-950 border-red-200 dark:border-red-900/50 shadow-sm"
          onClick={onDeleteClick}
          type="button"
        >
          <Trash2 className="w-4 h-4 mr-2 text-red-500" />
          Remove task
        </Button>
      </div>
    </div>
  );
}
