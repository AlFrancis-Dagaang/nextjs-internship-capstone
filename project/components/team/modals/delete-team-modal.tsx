// components/team/modals/delete-team-modal.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteTeam } from "@/lib/actions/team"

type DeleteTeamModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (teamId: string) => void
  teamId: string
  teamName: string
}

export function DeleteTeamModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  teamName,
}: DeleteTeamModalProps) {
  const { toast } = useToast()
  const [confirmed, setConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isOpen) setConfirmed(false)
  }, [isOpen])

  async function handleConfirmDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteTeam(teamId)

      if (!result?.success) {
        toast({
          title: "Failed to delete team",
          description: result?.error || "Action was blocked or failed.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Team deleted",
        description: `"${teamName}" was permanently deleted.`,
      })
      onClose()
      onSuccess(teamId)
    } catch {
      toast({
        title: "Failed to delete team",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-md bg-card border border-border rounded-3xl shadow-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-foreground text-base">
            Delete Team
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Warning Note Box */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 flex items-start space-x-3">
            <p className="text-xs font-medium text-destructive leading-tight">
              <strong>Note:</strong> The team &quot;{teamName}&quot; and all its
              associated memberships will be permanently deleted.
            </p>
          </div>

          {/* Agreement Checkbox Box */}
          <div
            onClick={() => setConfirmed((prev) => !prev)}
            className="border border-border bg-muted/50 rounded-2xl p-3.5 flex items-start space-x-3 cursor-pointer select-none hover:bg-muted transition-colors"
          >
            <div className="mt-0.5 pointer-events-none">
              <Checkbox
                checked={confirmed}
                onCheckedChange={() => {}}
                className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
            <p className="text-xs font-medium text-foreground leading-tight">
              I agree that this action is irreversible and permanently removes
              all related team data.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full sm:w-auto h-9 text-xs rounded-xl border-border bg-card text-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={!confirmed || isDeleting}
              className="w-full sm:w-auto h-9 text-xs rounded-xl cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
