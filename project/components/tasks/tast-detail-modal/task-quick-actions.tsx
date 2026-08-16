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
      <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
        Quick Actions
      </Label>
      <div className="flex flex-col gap-2">
        {task.isArchived ? (
          <>
            {/* Restore Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-foreground bg-card border-input hover:bg-accent"
              onClick={handleRestore}
              disabled={isPending}
              type="button"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-muted-foreground" />
              Restore
            </Button>

            {/* Delete Permanently Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 bg-card border-destructive/30 shadow-sm"
              onClick={onDeleteClick}
              disabled={isPending}
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
              Delete permanently
            </Button>
          </>
        ) : (
          <>
            {/* Archive Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-foreground bg-card border-input hover:bg-accent"
              onClick={handleArchiveClick}
              disabled={!canEdit}
              type="button"
            >
              <Archive className="w-4 h-4 mr-2 text-muted-foreground" />
              Archive task
            </Button>

            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 bg-card border-destructive/30 shadow-sm"
              onClick={onDeleteClick}
              disabled={!canEdit}
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
              Remove task
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
