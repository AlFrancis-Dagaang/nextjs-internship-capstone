"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTaskAssignees } from "@/lib/actions/task-assignees";
import { AssignTaskModal } from "../modal/assign-task-modal";
import type { Task } from "@/lib/db/schema";
import type { TaskWithCommentCount } from "@/components/lists/board";

type AssigneeUser = {
  id: string;
  name?: string;
  email?: string;
};

type TaskAssignee = {
  id: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  userName: string;
  userEmail: string;
};

type TaskMembersSectionProps = {
  task: Task;
  projectId: string;
  assignableUsers: AssigneeUser[];
  canEdit: boolean;
  onUpdated?: (task: TaskWithCommentCount) => void;
};

export function TaskMembersSection({
  task,
  projectId,
  assignableUsers = [],
  canEdit,
  onUpdated,
}: TaskMembersSectionProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);

  const taskRef = useRef(task);
  taskRef.current = task;
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  const fetchAssignees = useCallback(async () => {
    const result = await getTaskAssignees(task.id);
    if (result.success) {
      setAssignees(result.data);
      onUpdatedRef.current?.({
        ...taskRef.current,
        assignees: result.data.map((a) => ({
          userId: a.userId,
          name: a.userName,
          email: a.userEmail,
        })),
      });
    } else {
      toast({
        title: "Failed to load assignees",
        description: result.error,
        variant: "destructive",
      });
    }
  }, [task.id, toast]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const visibleAssignees = assignees.slice(0, 3);
  const extraCount = assignees.length > 3 ? assignees.length - 3 : 0;

  const currentAssigneeUsers: AssigneeUser[] = assignees.map((a) => ({
    id: a.userId,
    name: a.userName,
    email: a.userEmail,
  }));

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Assignees
      </Label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={canEdit ? () => setModalOpen(true) : undefined}
          disabled={!canEdit}
          className={`flex items-center gap-2 rounded-lg p-1 -m-1 transition-colors ${
            canEdit
              ? "hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              : "cursor-default"
          }`}
        >
          {assignees.length > 0 ? (
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center">
                <div className="flex -space-x-1.5">
                  {visibleAssignees.map((a) => (
                    <div
                      key={a.id}
                      className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-medium text-blue-700 dark:text-blue-300 uppercase"
                      title={`${a.userName || a.userEmail}`}
                    >
                      {a.userName?.[0] ?? a.userEmail?.[0] ?? "U"}
                    </div>
                  ))}
                </div>
                {extraCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold">
                    +{extraCount}
                  </span>
                )}
              </div>
              {canEdit && (
                <div className="h-6 w-6 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors">
                  <Plus size={12} className="text-neutral-400" />
                </div>
              )}
            </div>
          ) : canEdit ? (
            <>
              <div className="h-7 w-7 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                <Plus size={14} className="text-neutral-400" />
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Assign
              </span>
            </>
          ) : (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
              No assignees
            </span>
          )}

          {assignees.length > 0 && (
            <span className="text-xs text-neutral-700 dark:text-neutral-300 ml-1">
              {assignees.length} assigned
            </span>
          )}
        </button>
      </div>

      {canEdit && (
        <AssignTaskModal
          taskId={task.id}
          projectId={projectId}
          currentAssignees={currentAssigneeUsers}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={fetchAssignees}
        />
      )}
    </div>
  );
}
