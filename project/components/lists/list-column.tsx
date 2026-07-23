"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";
import { updateList, deleteList } from "@/lib/actions/lists";
import { Input } from "@/components/ui/input";
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
import type { ListWithTasks } from "./board";

export function ListColumn({
  list,
  onChanged,
}: {
  list: ListWithTasks;
  onChanged?: () => void;
}) {
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [isPending, startTransition] = useTransition();

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === "" || name === list.name) {
      setIsRenaming(false);
      setName(list.name);
      return;
    }
    startTransition(async () => {
      const result = await updateList(list.id, { name });
      if (!result.success) {
        toast({
          title: "Failed to rename list",
          description: result.error,
          variant: "destructive",
        });
        setName(list.name); // revert to old value
        setIsRenaming(false);
        return;
      }
      toast({ title: "List renamed", description: result.data?.name });
      setIsRenaming(false);
      onChanged?.();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteList(list.id);
      if (result.success) {
        toast({
          title: "List deleted",
          description: `"${list.name}" was deleted.`,
        });
        onChanged?.();
      } else {
        toast({
          title: "Failed to delete list",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="shrink-0 w-80">
      <div className="bg-white dark:bg-outer_space-400 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400">
        <div className="p-4 border-b border-french_gray-300 dark:border-paynes_gray-400">
          <div className="flex items-center justify-between">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex-1 mr-2">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  disabled={isPending}
                  className="h-8"
                />
              </form>
            ) : (
              <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500">
                {list.name}
                <span className="ml-2 px-2 py-1 text-xs bg-french_gray-300 dark:bg-paynes_gray-400 rounded-full">
                  {list.tasks.length}
                </span>
              </h3>
            )}

            {!isRenaming && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setName(list.name);
                      setIsRenaming(true);
                    }}
                  >
                    Rename
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
                        <AlertDialogTitle>Delete list?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{list.name}" and all{" "}
                          {list.tasks.length} task
                          {list.tasks.length === 1 ? "" : "s"} in it. This
                          cannot be undone.
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
            )}
          </div>
        </div>

        <div className="p-4 space-y-3 min-h-100">
          {list.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          <CreateTaskModal listId={list.id} onCreated={onChanged} />
        </div>
      </div>
    </div>
  );
}
