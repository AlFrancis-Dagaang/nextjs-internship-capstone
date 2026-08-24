// components/projects/modals/delete-project-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteProject } from "@/lib/actions/projects";
import { useToast } from "@/hooks/use-toast";

type DeleteProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
  projectId: string;
  projectName: string;
};

export function DeleteProjectModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
}: DeleteProjectModalProps) {
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wrap the action in a closure function so arguments are correctly passed through to useReverification
  const deleteProjectWithReverification = useReverification(
    async (id: string) => {
      return deleteProject(id);
    },
  );

  useEffect(() => {
    if (isOpen) setConfirmed(false);
  }, [isOpen]);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      const result = (await deleteProjectWithReverification(projectId)) as any;

      if (!result || typeof result.success !== "boolean" || !result.success) {
        toast({
          title: "Failed to delete project",
          description:
            result?.error || "Reverification failed or action was blocked.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Project deleted",
        description: `"${projectName}" was permanently deleted.`,
      });
      onClose();
      onSuccess(projectId);
    } catch (err) {
      if (isReverificationCancelledError(err)) return; // User backed out of Clerk reverification

      toast({
        title: "Failed to delete project",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-border rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-foreground">
            Delete Project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Warning Note Box */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 flex items-start space-x-3">
            <p className="text-xs font-medium text-destructive leading-tight">
              <strong>Note:</strong> The project &quot;{projectName}&quot; and
              all its lists, tasks, and member mappings will be permanently
              deleted.
            </p>
          </div>

          {/* Agreement Checkbox Box */}
          <div
            onClick={() => setConfirmed((prev) => !prev)}
            className="border border-border bg-muted/50 rounded-2xl p-3 flex items-start space-x-3 cursor-pointer select-none hover:bg-muted transition-colors"
          >
            <div className="mt-0.5 pointer-events-none">
              <Checkbox
                checked={confirmed}
                onCheckedChange={() => {}}
                className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
            <p className="text-xs font-medium text-foreground leading-tight">
              I am agreeing that this action is irreversible and permanently
              removes all related project data.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={!confirmed || isDeleting}
              className="rounded-xl"
            >
              {isDeleting ? "Deleting..." : "Delete project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
