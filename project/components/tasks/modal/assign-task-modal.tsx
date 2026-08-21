"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Search, Loader2, UserMinus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  assignUserToTask,
  unassignUserFromTask,
} from "@/lib/actions/task-assignees";
import { getAssignableUsers } from "@/lib/actions/project-member";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

type AssigneeUser = {
  id: string;
  name?: string;
  email?: string;
};

type AssignTaskModalProps = {
  taskId: string;
  projectId: string;
  currentAssignees: AssigneeUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AssignTaskModal({
  taskId,
  projectId,
  currentAssignees,
  open,
  onOpenChange,
  onSuccess,
}: AssignTaskModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [isPending, startTransition] = useTransition();

  const [assignableUsers, setAssignableUsers] = useState<AssigneeUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setSearchQuery("");
    setSelectedUserIds(new Set(currentAssignees.map((u) => u.id)));
    setIsLoadingUsers(true);

    getAssignableUsers(projectId).then((result) => {
      if (cancelled) return;
      setIsLoadingUsers(false);
      if (result.success) {
        setAssignableUsers(result.data);
      } else {
        toast({
          title: "Failed to load members",
          description: result.error,
          variant: "destructive",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const originalIds = new Set(currentAssignees.map((u) => u.id));

  const currentlyAssignedUsers = assignableUsers.filter((u) =>
    selectedUserIds.has(u.id),
  );
  const availableUsers = assignableUsers.filter(
    (u) => !selectedUserIds.has(u.id),
  );

  const filteredAvailableUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = u.email?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch;
  });

  function handleToggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function handleSave() {
    const finalIds = selectedUserIds;

    const toAssign = Array.from(finalIds).filter((id) => !originalIds.has(id));
    const toUnassign = Array.from(originalIds).filter(
      (id) => !finalIds.has(id),
    );

    if (toAssign.length === 0 && toUnassign.length === 0) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const assignPromises = toAssign.map((userId) =>
        assignUserToTask(taskId, userId).then((res) => ({
          userId,
          res,
          action: "assign",
        })),
      );
      const unassignPromises = toUnassign.map((userId) =>
        unassignUserFromTask(taskId, userId).then((res) => ({
          userId,
          res,
          action: "unassign",
        })),
      );

      const results = await Promise.all([
        ...assignPromises,
        ...unassignPromises,
      ]);
      const failures = results.filter((r) => !r.res.success);

      if (failures.length > 0) {
        toast({
          title: "Some changes failed",
          description: `${failures.length} operation(s) could not be completed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Assignees updated",
          description: "Successfully updated task assignees.",
        });
      }

      onSuccess();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card text-card-foreground border-border/80 rounded-2xl shadow-2xl p-6 [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <DialogHeader className="p-0 space-y-1">
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Assign Task Members
            </DialogTitle>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-1 px-1">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Loading members...</span>
            </div>
          ) : (
            <>
              {currentlyAssignedUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Currently Assigned ({currentlyAssignedUsers.length})
                  </label>
                  <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden bg-muted/30">
                    {currentlyAssignedUsers.map((user) => {
                      const displayName = user.name || user.email || "U";
                      const stableColorKey =
                        user.id || user.email || user.name || "";
                      return (
                        <div
                          key={user.id}
                          className="px-3 py-2 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-medium uppercase ring-2 ring-card shrink-0 shadow-2xs ${getAvatarColor(
                                stableColorKey,
                              )}`}
                            >
                              {getInitials(displayName)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">
                                {user.name ?? user.email}
                              </span>
                              {user.name && user.email && (
                                <span className="text-[10px] text-muted-foreground">
                                  {user.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUser(user.id)}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                          >
                            <UserMinus size={13} className="mr-1.5" />
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Add Members
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={14}
                  />
                  <Input
                    placeholder="Search available members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-xs bg-muted border border-border rounded-xl w-full shadow-2xs focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-border/60 border border-border/80 rounded-xl bg-card">
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      {assignableUsers.length === currentlyAssignedUsers.length
                        ? "All project members are already assigned"
                        : "No matching members found"}
                    </div>
                  ) : (
                    filteredAvailableUsers.map((user) => {
                      const isChecked = selectedUserIds.has(user.id);
                      const displayName = user.name || user.email || "U";
                      const stableColorKey =
                        user.id || user.email || user.name || "";

                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleUser(user.id)}
                          className="px-3 py-2.5 flex items-center justify-between hover:bg-accent/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-medium uppercase ring-2 ring-card shrink-0 shadow-2xs ${getAvatarColor(
                                stableColorKey,
                              )}`}
                            >
                              {getInitials(displayName)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">
                                {user.name ?? user.email}
                              </span>
                              {user.name && user.email && (
                                <span className="text-[10px] text-muted-foreground">
                                  {user.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleUser(user.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-md"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-8 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl shadow-2xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending || isLoadingUsers}
              className="h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-xl shadow-2xs cursor-pointer"
            >
              {isPending && (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
