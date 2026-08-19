"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceTeam } from "@/lib/services/team";
import { createTeam, updateTeam } from "@/lib/actions/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users2 } from "lucide-react";

type TeamModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: WorkspaceTeam | null;
};

export function TeamModal({ open, onOpenChange, team }: TeamModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!team;

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      setError(null);
    }
  }, [open, team]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      let res;
      if (isEdit && team) {
        res = await updateTeam(team.id, { name });
      } else {
        res = await createTeam({ name });
      }

      if (res.success) {
        toast({
          title: isEdit
            ? "Team updated successfully"
            : "Team created successfully",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error);
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    });
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
              disabled={isPending}
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
              disabled={isPending}
              className="h-8 text-xs shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
              className="h-8 text-xs shadow-sm"
            >
              {isEdit ? "Save Changes" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
