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
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-foreground">
            Delete Task
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start space-x-3">
            <Checkbox
              id="confirm-task-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />
            <label
              htmlFor="confirm-task-delete"
              className="text-xs font-medium text-destructive cursor-pointer leading-tight"
            >
              The task will be permanently deleted from this list.
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="border-input"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              disabled={!confirmed || isPending}
            >
              {isPending ? "Deleting..." : "Delete task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
