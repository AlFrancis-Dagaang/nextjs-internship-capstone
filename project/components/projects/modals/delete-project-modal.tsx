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
      <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-foreground">
            Delete Project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div
            onClick={() => setConfirmed((prev) => !prev)}
            className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start space-x-3 cursor-pointer select-none"
          >
            <div className="mt-0.5 pointer-events-none">
              <Checkbox
                checked={confirmed}
                onCheckedChange={() => {}} // Controlled manually by container click
                className="border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
              />
            </div>
            <p className="text-xs font-medium text-destructive leading-tight">
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
              className="rounded-lg border-border bg-card text-foreground hover:bg-muted"
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
