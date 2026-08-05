"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  isPending: boolean;
};

export function DeleteMemberModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  isPending,
}: DeleteMemberModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-neutral-900 dark:text-neutral-100">
            Remove Member
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md p-3">
            <p className="text-xs font-medium text-red-900 dark:text-red-200 leading-tight">
              &quot;{memberName}&quot; will lose access to this project
              immediately. They can be re-added later if needed.
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
              disabled={isPending}
              className="rounded-lg"
            >
              {isPending ? "Removing..." : "Remove member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
