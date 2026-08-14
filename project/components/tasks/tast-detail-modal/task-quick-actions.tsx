"use client";

import { Archive, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Task } from "@/lib/db/schema";
import { restoreTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { useBoardStore } from "@/stores/board-store";
import { useTransition } from "react";

export function TaskQuickActions({
  task,
  onArchive,
  canEdit,
  onDeleteClick,
  role,
  onRestored,
  onOpenChange,
}: {
  task: Task;
  onArchive?: () => void;
  onDeleteClick?: () => void;
  canEdit: boolean;
  role: "owner" | "editor" | "viewer";
  onRestored?: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const insertTaskAt = useBoardStore((s) => s.insertTaskAt);

  if (role === "viewer") return null;

  const handleRestore = () => {
    startTransition(async () => {
      const res = await restoreTask(task.id);
      if (res.success) {
        toast({
          title: "Task restored",
          description: `"${task.title}" has been restored.`,
        });
        insertTaskAt(task.listId, res.data, res.data.position);
        onRestored?.();
      } else {
        toast({
          title: "Failed to restore task",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleArchiveClick = () => {
    onArchive?.();
    onOpenChange?.(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Quick Actions
      </Label>
      <div className="flex flex-col gap-2">
        {task.isArchived ? (
          <>
            {/* Restore Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-950"
              onClick={handleRestore}
              disabled={isPending}
              type="button"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-neutral-400" />
              Restore
            </Button>

            {/* Delete Permanently Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 bg-white dark:bg-neutral-950 border-red-200 dark:border-red-900/50 shadow-sm"
              onClick={onDeleteClick}
              disabled={isPending}
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
              Delete permanently
            </Button>
          </>
        ) : (
          <>
            {/* Archive Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-950"
              onClick={handleArchiveClick}
              disabled={!canEdit}
              type="button"
            >
              <Archive className="w-4 h-4 mr-2 text-neutral-400" />
              Archive task
            </Button>

            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 bg-white dark:bg-neutral-950 border-red-200 dark:border-red-900/50 shadow-sm"
              onClick={onDeleteClick}
              disabled={!canEdit}
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
              Remove task
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
