// components/tasks/task-detail-modal/assign-task-modal.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Search, Loader2, UserMinus, Plus } from "lucide-react";
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

type AssigneeUser = {
  id: string;
  name?: string;
  email?: string;
};

type AssignTaskModalProps = {
  taskId: string;
  projectId: string;
  assignableUsers: AssigneeUser[];
  currentAssignees: AssigneeUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AssignTaskModal({
  taskId,
  assignableUsers,
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

  // Reset checked state and search whenever modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedUserIds(new Set(currentAssignees.map((u) => u.id)));
    }
  }, [open, currentAssignees]);

  const originalIds = new Set(currentAssignees.map((u) => u.id));

  // Split assignable pool into currently assigned vs available to add
  const currentlyAssignedUsers = assignableUsers.filter((u) =>
    selectedUserIds.has(u.id),
  );
  const availableUsers = assignableUsers.filter(
    (u) => !selectedUserIds.has(u.id),
  );

  // Filter available users based on search query
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
      <DialogContent className="max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <DialogHeader className="p-0 space-y-1">
            <DialogTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Assign Task Members
            </DialogTitle>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-1 px-1">
          {/* Section 1: Current Assignees */}
          {currentlyAssignedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Currently Assigned ({currentlyAssignedUsers.length})
              </label>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-50/50 dark:bg-neutral-800/20">
                {currentlyAssignedUsers.map((user) => {
                  const initials = user.name?.[0] ?? user.email?.[0] ?? "U";
                  return (
                    <div
                      key={user.id}
                      className="px-3 py-2 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-medium uppercase">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                            {user.name ?? user.email}
                          </span>
                          {user.name && user.email && (
                            <span className="text-[10px] text-neutral-400">
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
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md"
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

          {/* Section 2: Add Members with Search & Checkboxes */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Add Members
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={14}
              />
              <Input
                placeholder="Search available members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg w-full focus-visible:ring-1"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-lg">
              {filteredAvailableUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  {assignableUsers.length === currentlyAssignedUsers.length
                    ? "All project members are already assigned"
                    : "No matching members found"}
                </div>
              ) : (
                filteredAvailableUsers.map((user) => {
                  const isChecked = selectedUserIds.has(user.id);
                  const initials = user.name?.[0] ?? user.email?.[0] ?? "U";

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleToggleUser(user.id)}
                      className="px-3 py-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-medium uppercase">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                            {user.name ?? user.email}
                          </span>
                          {user.name && user.email && (
                            <span className="text-[10px] text-neutral-400">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleUser(user.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-9 text-xs rounded-lg border-neutral-200 dark:border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="h-9 px-4 bg-cyan-400 hover:bg-cyan-500 text-neutral-900 text-xs font-medium rounded-lg shadow-none"
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
