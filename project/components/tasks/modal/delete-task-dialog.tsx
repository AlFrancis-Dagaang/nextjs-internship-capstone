// components/tasks/modal/delete-task-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export function DeleteTaskDialog({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
  isPending: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) setConfirmed(false);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-md bg-card text-card-foreground border border-border/80 rounded-3xl shadow-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground text-center">
            Delete Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {taskTitle && (
            <p className="text-sm text-muted-foreground text-center px-2 line-clamp-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &quot;{taskTitle}&quot;
              </span>
              ?
            </p>
          )}

          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start space-x-3 transition-colors">
            <Checkbox
              id="confirm-task-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive data-[state=checked]:text-destructive-foreground rounded-md shadow-xs cursor-pointer"
            />
            <label
              htmlFor="confirm-task-delete"
              className="text-xs sm:text-sm font-medium text-destructive cursor-pointer leading-tight select-none"
            >
              The task will be permanently deleted from this list.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="w-full sm:w-auto h-10 px-4 text-xs sm:text-sm font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl shadow-2xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              disabled={!confirmed || isPending}
              className="w-full sm:w-auto h-10 px-4 text-xs sm:text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-2xs cursor-pointer"
            >
              {isPending ? "Deleting..." : "Delete task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
