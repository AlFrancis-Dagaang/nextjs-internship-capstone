// components/team/modals/team-modal.tsx
"use client"

import { Users2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createTeam, updateTeam } from "@/lib/actions/team"
import type { WorkspaceTeam } from "@/lib/services/team"
import { useTeamStore } from "@/stores/team-store"

type TeamModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: WorkspaceTeam | null
}

export function TeamModal({ open, onOpenChange, team }: TeamModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!team

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "")
      setError(null)
    }
  }, [open, team])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    // 1. Close the modal INSTANTLY for a snappy UI experience
    onOpenChange(false)

    startTransition(async () => {
      let res: { success: boolean; data?: any; error?: string } | undefined
      if (isEdit && team) {
        res = await updateTeam(team.id, { name: trimmedName })
      } else {
        res = await createTeam({ name: trimmedName })
      }

      if (res?.success && res.data) {
        toast({
          title: isEdit
            ? "Team updated successfully"
            : "Team created successfully",
        })

        if (!isEdit) {
          const newTeam: WorkspaceTeam = {
            ...(res.data as unknown as WorkspaceTeam),
            memberCount: 0,
          }
          useTeamStore.getState().triggerTeamCreated(newTeam)
        }

        router.refresh()
      } else {
        const errorMessage =
          res && !res.success ? res.error : "Failed to save team"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users2 size={16} />
            <span className="text-xs font-semibold tracking-wider uppercase">
              {isEdit ? "Team Settings" : "Team Hub"}
            </span>
          </div>
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            {isEdit ? "Edit Team Name" : "Create New Team"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="team-name"
              className="text-xs font-medium text-foreground"
            >
              Team Name
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Engineering, Product Design"
              autoFocus
              className="h-9 text-xs bg-card border-input shadow-sm"
            />
            {error && (
              <p className="text-[11px] text-destructive mt-1 font-medium">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim()}
              className="h-8 text-xs shadow-sm"
            >
              {isEdit ? "Save Changes" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
