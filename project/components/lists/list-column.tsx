"use client";

import { useState, useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";
import { updateList, deleteList } from "@/lib/actions/lists";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ListActions } from "./modal/list-actions";
import { DeleteListDialog } from "./modal/delete-list-dialog";
import type { List, Task } from "@/lib/db/schema";
import type { ListWithTasks } from "./board";

export function ListColumn({
  list,
  totalLists,
  allLists,
  onOpenTask,
  onRenamed,
  onDeleted,
  onMoved,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskMoved,
}: {
  list: ListWithTasks;
  totalLists: number;
  allLists: ListWithTasks[];
  onRenamed?: (updated: List) => void;
  onDeleted?: (listId: string) => void;
  onMoved?: (updatedLists: List[]) => void;
  onTaskCreated?: (listId: string, task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (listId: string, taskId: string) => void;
  onTaskMoved?: (task: Task, affectedTasks: Task[]) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // #21 — column itself is a droppable target (id = list.id) so a task can
  // be dropped into an empty column, in addition to the SortableContext
  // below handling reorder/insert among existing task cards.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: list.id,
    data: { type: "list", listId: list.id },
  });

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
      {/* Changed h-full to h-fit and max-h-full so it only grows with tasks, but caps at container height */}
      <div
        className={`shrink-0 w-80 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 flex flex-col h-fit max-h-full relative isolate transition-colors ${
          isOver ? "ring-2 ring-blue-munsell/60" : ""
        }`}
      >
        {/* Header */}
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
              currentPosition={list.position}
              totalLists={totalLists}
              onRename={() => {
                setName(list.name);
                setIsRenaming(true);
              }}
              onDelete={() => setIsDeleteOpen(true)}
              onMoved={onMoved}
            />
          )}
        </div>

        {/* Scrollable Tasks Container (grows organically, scrolls if content exceeds screen bounds) */}
        <div
          ref={setDroppableRef}
          className="overflow-y-auto overflow-x-visible space-y-3 pr-1 max-h-[calc(100vh-14rem)] min-h-[2rem]"
        >
          <SortableContext
            items={list.tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {list.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={list.projectId}
                allLists={allLists}
                onUpdated={onTaskUpdated}
                onDeleted={() => onTaskDeleted?.(list.id, task.id)}
                onMoved={(movedTask, affectedTasks) =>
                  onTaskMoved?.(movedTask, affectedTasks)
                }
                onOpenDetail={() => onOpenTask(task.id)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Create Task Footer (sits right beneath the tasks, moves down with them) */}
        <div className="pt-3 mt-2 shrink-0 bg-neutral-100 dark:bg-neutral-800">
          <CreateTaskModal
            listId={list.id}
            onCreated={(task) => onTaskCreated?.(list.id, task)}
          />
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
