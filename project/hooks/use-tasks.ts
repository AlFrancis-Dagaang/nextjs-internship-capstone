"use client";

import { useState, useTransition, useCallback } from "react";
import { moveTaskToList } from "@/lib/actions/tasks";
import { getListsByProject } from "@/lib/actions/lists";
import type { List } from "@/lib/db/schema";
import { useToast } from "@/hooks/use-toast";

export function useTaskLists(projectId: string) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoadingLists, startLoadTransition] = useTransition();

  const loadLists = useCallback(() => {
    startLoadTransition(async () => {
      const result = await getListsByProject(projectId);
      if (result.success) {
        setLists(result.data);
      }
    });
  }, [projectId]);

  return { lists, loadLists, isLoadingLists };
}

export function useMoveTask() {
  const { toast } = useToast();
  const [isMoving, startMoveTransition] = useTransition();

  function moveTask(taskId: string, newListId: string, onSuccess?: () => void) {
    startMoveTransition(async () => {
      const result = await moveTaskToList(taskId, newListId);
      if (!result.success) {
        toast({
          title: "Failed to move task",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Task moved" });
      onSuccess?.();
    });
  }

  return { moveTask, isMoving };
}
