"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import type { Task } from "@/lib/db/schema";
import { deleteTask } from "@/lib/actions/tasks";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const priorityStyles: Record<string, string> = {
  low: "bg-blue_munsell-100 text-blue_munsell-700 dark:bg-blue_munsell-900 dark:text-blue_munsell-300",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast({
          title: "Task deleted",
          description: `"${task.title}" was deleted.`,
        });
        router.refresh();
      } else {
        toast({
          title: "Failed to delete task",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="relative p-4 bg-white dark:bg-outer_space-300 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-outer_space-500 dark:text-platinum-500 text-sm pr-2">
          {task.title}
        </h4>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1 shrink-0"
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{task.title}" and cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-paynes_gray-500 dark:text-french_gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        {task.priority ? (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${priorityStyles[task.priority]}`}
          >
            {task.priority[0].toUpperCase() + task.priority.slice(1)}
          </span>
        ) : (
          <span />
        )}
        {task.assigneeId && (
          <div className="w-6 h-6 bg-blue_munsell-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            •
          </div>
        )}
      </div>
      {task.dueDate && (
        <p className="text-xs text-paynes_gray-500 dark:text-french_gray-400 mt-2">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      <CreateTaskModal
        listId={task.listId}
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={<span className="hidden" />}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
