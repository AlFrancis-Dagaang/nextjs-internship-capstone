// components/projects/modals/delete-project-modal.tsx
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

type DeleteProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isPending: boolean;
};

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isPending,
}: DeleteProjectModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) setConfirmed(false);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-neutral-900 dark:text-neutral-100">
            Delete Project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div
            onClick={() => setConfirmed((prev) => !prev)}
            className="bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md p-3 flex items-start space-x-3 cursor-pointer select-none"
          >
            <div className="mt-0.5 pointer-events-none">
              <Checkbox
                checked={confirmed}
                onCheckedChange={() => {}} // Controlled manually by container click
                className="border-red-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
            </div>
            <p className="text-xs font-medium text-red-900 dark:text-red-200 leading-tight">
              The project &quot;{projectName}&quot; and all its lists, tasks,
              and member mappings will be permanently deleted.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border-neutral-200 dark:border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              disabled={!confirmed || isPending}
              className="rounded-lg"
            >
              {isPending ? "Deleting..." : "Delete project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
