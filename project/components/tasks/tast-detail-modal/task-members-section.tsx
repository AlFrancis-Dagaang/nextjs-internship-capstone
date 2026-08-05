"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";

type Assignee = {
  id: string; // this is users.id, matches task.assigneeId
  name?: string;
  email?: string;
};

type TaskMembersSectionProps = {
  task: Task;
  assignableUsers: Assignee[]; // project owner + members, passed from parent
  onUpdated?: (task: Task) => void;
};

export function TaskMembersSection({
  task,
  assignableUsers = [],
  onUpdated,
}: TaskMembersSectionProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentAssignee = assignableUsers.find((u) => u.id === task.assigneeId);

  function handleAssign(userId: string | null) {
    setOpen(false);
    startTransition(async () => {
      const result = await updateTask(task.id, { assigneeId: userId });
      if (!result.success) {
        toast({
          title: "Failed to update assignee",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      onUpdated?.(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Assignee
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={isPending}
            className="flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg p-1 -m-1 transition-colors"
          >
            {currentAssignee ? (
              <>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">
                  {currentAssignee.name?.[0] ??
                    currentAssignee.email?.[0] ??
                    "U"}
                </div>
                <span className="text-xs text-neutral-700 dark:text-neutral-300">
                  {currentAssignee.name ?? currentAssignee.email}
                </span>
              </>
            ) : (
              <>
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                  <Plus size={14} className="text-neutral-400" />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Assign
                </span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          <button
            onClick={() => handleAssign(null)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            Unassigned
            {!task.assigneeId && <Check size={13} />}
          </button>
          {assignableUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => handleAssign(u.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[9px] font-medium text-blue-700 dark:text-blue-300 uppercase">
                  {u.name?.[0] ?? u.email?.[0] ?? "U"}
                </div>
                {u.name ?? u.email}
              </span>
              {task.assigneeId === u.id && <Check size={13} />}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
