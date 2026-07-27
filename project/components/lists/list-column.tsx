"use client";

import { useState, useTransition } from "react";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";
import { updateList, deleteList } from "@/lib/actions/lists";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ListActions } from "./modal/list-actions";
import { DeleteListDialog } from "./modal/delete-list-dialog";
import type { List } from "@/lib/db/schema";
import type { ListWithTasks } from "./board";

export function ListColumn({
  list,
  onChanged,
  onRenamed,
  onDeleted,
  onMoved,
}: {
  list: ListWithTasks;
  /** Still triggers a full refresh — only tasks use this for now. */
  onChanged?: () => void;
  onRenamed?: (updated: List) => void;
  onDeleted?: (listId: string) => void;
  onMoved?: () => void;
}) {
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
        setName(list.name);
        setIsRenaming(false);
        return;
      }
      toast({ title: "List renamed", description: result.data?.name });
      setIsRenaming(false);
      onRenamed?.(result.data);
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
        setIsDeleteOpen(false);
        onDeleted?.(list.id);
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
    <>
      <div className="shrink-0 w-80 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 flex flex-col max-h-[calc(100vh-16rem)] relative isolate">
        <div className="flex items-center justify-between pb-3 px-1 shrink-0">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex-1 mr-2">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleRenameSubmit}
                disabled={isPending}
                className="h-7 px-2 text-xs font-bold uppercase tracking-wider bg-white dark:bg-neutral-900 dark:border-neutral-700 rounded shadow-sm focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
              />
            </form>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                {list.name}
              </h3>
              <span className="text-xs text-neutral-500 font-semibold">
                {list.tasks.length}
              </span>
            </div>
          )}

          {!isRenaming && (
            <ListActions
              listId={list.id}
              listName={list.name}
              onRename={() => {
                setName(list.name);
                setIsRenaming(true);
              }}
              onDelete={() => setIsDeleteOpen(true)}
              onMoved={onMoved}
            />
          )}
        </div>

        <div className="overflow-y-auto overflow-x-visible space-y-3 pr-1 flex-1">
          {list.tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={list.projectId} />
          ))}
          <CreateTaskModal listId={list.id} onCreated={onChanged} />
        </div>
      </div>

      <DeleteListDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        listName={list.name}
        isPending={isPending}
      />
    </>
  );
}
