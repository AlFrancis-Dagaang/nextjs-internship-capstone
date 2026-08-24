import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { List, Task } from "@/lib/db/schema";
import type {
  ListWithTasks,
  TaskWithCommentCount,
} from "@/components/lists/board";
import type { BoardRealtimeEvent } from "@/lib/realtime/server";

/**
 * #22 (pass 2) — board/task data + drag-in-progress state, extracted from
 * board.tsx's useState. This store holds ONLY pure state operations — no
 * network calls, no toasts (Zustand actions can't use React hooks like
 * useToast). The async persistence call to moveTaskToList and its toast
 * still live in board.tsx, which calls `endDrag` to get the computed
 * {finalListId, finalPosition}, then calls the server action itself and
 * uses `reconcileTaskMoved`/`revertToSnapshot` based on the result — same
 * split responsibility #24 already had, just relocated.
 */
interface BoardState {
  lists: ListWithTasks[];
  activeTask: TaskWithCommentCount | null;
  dragSnapshot: ListWithTasks[] | null;

  setInitialLists: (lists: ListWithTasks[]) => void;

  addList: (newList: List) => void;
  renameList: (updated: List) => void;
  removeList: (listId: string) => void;
  reorderLists: (updatedLists: List[]) => void;

  archiveTaskLocally: (taskId: string) => ListWithTasks[];
  revertArchiveSnapshot: (snapshot: ListWithTasks[]) => void;

  toggleTaskCompleteLocally: (taskId: string) => boolean; // returns previous value for revert
  revertTaskComplete: (taskId: string, previousValue: boolean) => void;

  addTask: (listId: string, task: Task) => void;
  insertTaskAt: (listId: string, task: Task, index: number) => void;
  updateTaskLocal: (task: Task) => void;
  removeTask: (listId: string, taskId: string) => void;
  reconcileTaskMoved: (movedTask: Task, affectedTasks: Task[]) => void;
  changeCommentCount: (taskId: string, delta: number) => void;
  // #23 — swaps a client-generated temp id (from an optimistic create) for
  // the server-confirmed task once createTask resolves. Searches by id
  // across all lists rather than requiring a listId, since the caller
  // (CreateTaskModal) doesn't need to track which list beyond what it
  // already passed to addTask.
  replaceOptimisticTask: (tempId: string, realTask: Task) => void;
  // #70 item 7 — assignee changes come from task-assignees.ts, which
  // doesn't return a full Task, so this sets just the assignees field
  // rather than going through updateTaskLocal's Task-shaped merge.
  updateTaskAssigneesLocal: (
    listId: string,
    taskId: string,
    assignees: TaskWithCommentCount["assignees"],
  ) => void;

  startDrag: (taskId: string) => void;
  clearActiveTask: () => void;
  dragOver: (activeId: string, overId: string) => void;
  endDrag: (
    activeId: string,
    overId: string,
  ) => { finalListId: string; finalPosition: number } | null;
  revertToSnapshot: () => void;
  applyOptimisticMove: (
    taskId: string,
    targetListId: string,
    targetPosition: number,
  ) => ListWithTasks[];
  revertMoveSnapshot: (snapshot: ListWithTasks[]) => void;

  activeListId: string | null;
  listDragSnapshot: ListWithTasks[] | null;

  startListDrag: (listId: string) => void;
  clearActiveList: () => void;
  dragListOver: (activeSortId: string, overSortId: string) => void;
  endListDrag: (
    activeSortId: string,
    overSortId: string,
  ) => { listId: string; finalPosition: number } | null;
  revertListSnapshot: () => void;

  // #70 item 7 — apply an event received from another client over Pusher.
  // Routes to the same local-update actions the optimistic path already
  // uses; the only difference is this data is server-confirmed, so there's
  // no snapshot/revert step. Deliberately does NOT duplicate any reconcile
  // logic that already exists above.
  applyRemoteEvent: (event: BoardRealtimeEvent) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  lists: [],
  activeTask: null,
  dragSnapshot: null,
  activeListId: null,
  listDragSnapshot: null,

  startListDrag: (listId) => {
    const { lists } = get();
    set({ activeListId: listId, listDragSnapshot: lists });
  },

  clearActiveList: () => set({ activeListId: null }),

  // Lists are a single row (no cross-container concept like tasks have),
  // so — unlike task dragOver — this does the actual reorder live, on
  // every hover. endListDrag just reads back the resulting index.
  // Lists are a single row, so this reorders live on every hover.
  dragListOver: (activeSortId, overSortId) => {
    if (activeSortId === overSortId) return;
    set((s) => {
      const cleanActiveId = activeSortId.toString().replace("list-sort-", "");
      const cleanOverId = overSortId.toString().replace("list-sort-", "");

      const oldIndex = s.lists.findIndex((l) => l.id === cleanActiveId);
      const newIndex = s.lists.findIndex((l) => l.id === cleanOverId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return s;

      const reordered = arrayMove(s.lists, oldIndex, newIndex);
      return { lists: reordered.map((l, i) => ({ ...l, position: i })) };
    });
  },

  endListDrag: (activeSortId, _overSortId) => {
    const { lists } = get();
    const cleanActiveId = activeSortId.toString().replace("list-sort-", "");
    const activeList = lists.find((l) => l.id === cleanActiveId);
    if (!activeList) return null;
    const finalPosition = lists.findIndex((l) => l.id === activeList.id);
    return { listId: activeList.id, finalPosition };
  },
  revertListSnapshot: () => {
    const { listDragSnapshot } = get();
    if (listDragSnapshot) {
      set({ lists: listDragSnapshot, listDragSnapshot: null });
    }
  },

  setInitialLists: (lists) => set({ lists }),

  addList: (newList) =>
    set((s) => ({ lists: [...s.lists, { ...newList, tasks: [] }] })),

  renameList: (updated) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === updated.id ? { ...l, name: updated.name } : l,
      ),
    })),

  removeList: (listId) =>
    set((s) => ({ lists: s.lists.filter((l) => l.id !== listId) })),

  reorderLists: (updatedLists) =>
    set((s) => {
      const taskMap = new Map(s.lists.map((l) => [l.id, l.tasks]));
      return {
        lists: updatedLists
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((l) => ({ ...l, tasks: taskMap.get(l.id) ?? [] })),
      };
    }),

  addTask: (listId, task) =>
    set((s) => ({
      lists: s.lists.map((l) => {
        if (l.id !== listId) return l;
        // Prevent duplicate if task already exists in this list
        if (l.tasks.some((t) => t.id === task.id)) return l;
        return { ...l, tasks: [...l.tasks, task] };
      }),
    })),

  insertTaskAt: (listId, task, index) =>
    set((s) => ({
      lists: s.lists.map((l) => {
        if (l.id !== listId) return l;
        const newTasks = [...l.tasks];
        const clampedIndex = Math.max(0, Math.min(index, newTasks.length));
        newTasks.splice(clampedIndex, 0, task);
        return { ...l, tasks: newTasks };
      }),
    })),

  // #24 fix, relocated: `task` is a plain Task from updateTask (no
  // commentCount, which is client-only) — merge instead of replace so the
  // comment count on the card doesn't silently reset to 0.
  updateTaskLocal: (task) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === task.listId
          ? {
              ...l,
              tasks: l.tasks.map((t) => {
                if (t.id !== task.id) return t;
                const incomingAssignees = (task as TaskWithCommentCount)
                  .assignees;
                // Merge incoming assignees with existing ones to preserve imageUrl/hasImage if omitted
                const mergedAssignees = incomingAssignees
                  ? incomingAssignees.map((ia) => {
                      const existing = t.assignees?.find(
                        (ea) =>
                          ea.userId === ia.userId || ea.email === ia.email,
                      );
                      return {
                        ...ia,
                        imageUrl: ia.imageUrl ?? existing?.imageUrl,
                        hasImage: ia.hasImage ?? existing?.hasImage,
                      };
                    })
                  : t.assignees;

                return {
                  ...task,
                  commentCount: t.commentCount,
                  assignees: mergedAssignees,
                };
              }),
            }
          : l,
      ),
    })),

  removeTask: (listId, taskId) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
          : l,
      ),
    })),

  replaceOptimisticTask: (tempId, realTask) =>
    set((s) => ({
      lists: s.lists.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === tempId
            ? { ...realTask, commentCount: t.commentCount ?? 0 }
            : t,
        ),
      })),
    })),

  updateTaskAssigneesLocal: (listId, taskId, assignees) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) => {
                if (t.id !== taskId) return t;
                const mergedAssignees = (assignees ?? []).map((ia: any) => {
                  const existing = t.assignees?.find(
                    (ea: any) =>
                      ea.userId === ia.userId || ea.email === ia.email,
                  );
                  return {
                    ...ia,
                    imageUrl: ia.imageUrl ?? existing?.imageUrl,
                    hasImage: ia.hasImage ?? existing?.hasImage,
                  };
                });
                return { ...t, assignees: mergedAssignees };
              }),
            }
          : l,
      ),
    })),

  // Same #24 fix as updateTaskLocal, for moveTaskToList's affectedTasks.
  reconcileTaskMoved: (movedTask, affectedTasks) =>
    set((s) => {
      const allExistingTasks = s.lists.flatMap((l) => l.tasks);
      const commentCountMap = new Map(
        allExistingTasks.map((t) => [
          t.id,
          (t as TaskWithCommentCount).commentCount,
        ]),
      );
      const assigneesMap = new Map(
        allExistingTasks.map((t) => [
          t.id,
          (t as TaskWithCommentCount).assignees,
        ]),
      );

      const affectedListIds = new Set(affectedTasks.map((t) => t.listId));
      const movedTaskId = movedTask.id;

      return {
        lists: s.lists.map((l) => {
          if (affectedListIds.has(l.id)) {
            const listAffectedTasks = affectedTasks
              .filter((t) => t.listId === l.id)
              .sort((a, b) => a.position - b.position)
              .map((t) => ({
                ...t,
                commentCount:
                  commentCountMap.get(t.id) ??
                  (t.id === movedTask.id
                    ? (movedTask as TaskWithCommentCount).commentCount
                    : 0),
                assignees:
                  assigneesMap.get(t.id) ??
                  (t.id === movedTask.id
                    ? (movedTask as TaskWithCommentCount).assignees
                    : []),
              }));
            return { ...l, tasks: listAffectedTasks };
          }

          if (
            l.tasks.some((t) => t.id === movedTaskId) &&
            l.id !== movedTask.listId
          ) {
            return {
              ...l,
              tasks: l.tasks.filter((t) => t.id !== movedTaskId),
            };
          }

          return l;
        }),
      };
    }),
  changeCommentCount: (taskId, delta) =>
    set((s) => ({
      lists: s.lists.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId
            ? { ...t, commentCount: Math.max(0, (t.commentCount ?? 0) + delta) }
            : t,
        ),
      })),
    })),

  startDrag: (taskId) => {
    const { lists } = get();
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    // Snapshot taken here (drag start), used by revertToSnapshot if the
    // persist call in board.tsx fails after drop.
    set({ activeTask: task ?? null, dragSnapshot: lists });
  },

  clearActiveTask: () => set({ activeTask: null }),

  dragOver: (activeId, overId) => {
    if (activeId === overId) return;
    set((s) => {
      const sourceList = s.lists.find((l) =>
        l.tasks.some((t) => t.id === activeId),
      );
      const destList =
        s.lists.find((l) => l.tasks.some((t) => t.id === overId)) ??
        s.lists.find((l) => l.id === overId);
      if (!sourceList || !destList) return s;

      const task = sourceList.tasks.find((t) => t.id === activeId);
      if (!task) return s;

      const overTaskIndex = destList.tasks.findIndex((t) => t.id === overId);
      const insertIndex =
        overTaskIndex >= 0 ? overTaskIndex : destList.tasks.length;

      // Same list: reorder in place, but bail out (return the SAME state
      // reference) if the task is already at/adjacent to that index.
      // Without this, every pointer-move event over the same spot produces
      // a brand-new array -> re-render -> dnd-kit remeasures rects -> fires
      // dragOver again -> infinite loop -> "Maximum update depth exceeded".
      if (sourceList.id === destList.id) {
        const currentIndex = sourceList.tasks.findIndex(
          (t) => t.id === activeId,
        );
        if (currentIndex === -1) return s;
        if (currentIndex === insertIndex || currentIndex === insertIndex - 1) {
          return s;
        }
        const reordered = arrayMove(
          sourceList.tasks,
          currentIndex,
          insertIndex,
        );
        return {
          lists: s.lists.map((l) =>
            l.id === sourceList.id ? { ...l, tasks: reordered } : l,
          ),
        };
      }

      // Cross-list: same no-op guard.
      const alreadyAtTarget =
        destList.tasks[insertIndex]?.id === activeId ||
        destList.tasks[insertIndex - 1]?.id === activeId;
      if (alreadyAtTarget) return s;

      const movedTask = { ...task, listId: destList.id };

      return {
        lists: s.lists.map((l) => {
          if (l.id === sourceList.id) {
            return { ...l, tasks: l.tasks.filter((t) => t.id !== activeId) };
          }
          if (l.id === destList.id) {
            const newTasks = [...l.tasks];
            newTasks.splice(insertIndex, 0, movedTask);
            return { ...l, tasks: newTasks };
          }
          return l;
        }),
      };
    });
  },

  // #24 fix, relocated: reads current `lists` via get() (not from inside
  // an updater callback) so the returned finalListId/finalPosition are
  // reliably available the instant this function returns — the original
  // bug was reading these from inside setLists()'s updater before it had
  // necessarily run.
  endDrag: (activeId, overId) => {
    const { lists } = get();
    const list = lists.find((l) => l.tasks.some((t) => t.id === activeId));
    if (!list) return null;

    const oldIndex = list.tasks.findIndex((t) => t.id === activeId);
    const newIndex = list.tasks.findIndex((t) => t.id === overId);

    const reordered =
      oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex
        ? arrayMove(list.tasks, oldIndex, newIndex)
        : list.tasks;

    const finalPosition = reordered.findIndex((t) => t.id === activeId);

    set({
      lists: lists.map((l) =>
        l.id === list.id
          ? { ...l, tasks: reordered.map((t, i) => ({ ...t, position: i })) }
          : l,
      ),
    });

    return { finalListId: list.id, finalPosition };
  },

  revertToSnapshot: () => {
    const { dragSnapshot } = get();
    if (dragSnapshot) set({ lists: dragSnapshot, dragSnapshot: null });
  },

  archiveTaskLocally: (taskId) => {
    const { lists } = get();
    const snapshot = lists;
    set({
      lists: lists.map((l) => ({
        ...l,
        tasks: l.tasks.filter((t) => t.id !== taskId),
      })),
    });
    return snapshot;
  },

  revertArchiveSnapshot: (snapshot) => set({ lists: snapshot }),
  applyOptimisticMove: (taskId, targetListId, targetPosition) => {
    const { lists } = get();
    const snapshot = lists;

    const sourceList = lists.find((l) => l.tasks.some((t) => t.id === taskId));
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    const destList = lists.find((l) => l.id === targetListId);
    if (!sourceList || !task || !destList) return snapshot;

    const movedTask = { ...task, listId: destList.id };

    set({
      lists: lists.map((l) => {
        if (l.id === sourceList.id && l.id === destList.id) {
          const withoutTask = l.tasks.filter((t) => t.id !== taskId);
          withoutTask.splice(targetPosition, 0, movedTask);
          return {
            ...l,
            tasks: withoutTask.map((t, i) => ({ ...t, position: i })),
          };
        }
        if (l.id === sourceList.id) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        }
        if (l.id === destList.id) {
          const newTasks = [...l.tasks];
          newTasks.splice(targetPosition, 0, movedTask);
          return {
            ...l,
            tasks: newTasks.map((t, i) => ({ ...t, position: i })),
          };
        }
        return l;
      }),
    });

    return snapshot;
  },

  revertMoveSnapshot: (snapshot) => set({ lists: snapshot }),

  toggleTaskCompleteLocally: (taskId) => {
    const { lists } = get();
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    const previousValue = task?.isCompleted ?? false;

    set({
      lists: lists.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
        ),
      })),
    });

    return previousValue;
  },

  revertTaskComplete: (taskId, previousValue) =>
    set((s) => ({
      lists: s.lists.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId ? { ...t, isCompleted: previousValue } : t,
        ),
      })),
    })),

  // #70 item 7 — dispatch table for remote board events. Each case calls
  // an existing action rather than reimplementing its logic.
  applyRemoteEvent: (event) => {
    const actions = get();
    switch (event.type) {
      case "task_created":
        actions.addTask(event.task.listId, event.task);
        break;
      case "task_updated":
        actions.updateTaskLocal(event.task);
        break;
      case "task_moved":
        actions.reconcileTaskMoved(event.task, event.affectedTasks);
        break;
      case "task_deleted":
        actions.removeTask(event.listId, event.taskId);
        break;
      case "task_archived":
        // archiveTaskLocally already searches/filters across all lists by
        // taskId, so no listId is needed here — same as the local path.
        actions.archiveTaskLocally(event.taskId);
        break;
      case "task_restored":
        actions.addTask(event.task.listId, event.task);
        break;
      case "task_assignees_updated":
        actions.updateTaskAssigneesLocal(
          event.listId,
          event.taskId,
          event.assignees,
        );
        break;
      case "task_comment_count_changed":
        actions.changeCommentCount(event.taskId, event.delta);
        break;
      case "list_created":
        actions.addList(event.list);
        break;
      case "list_updated":
        actions.renameList(event.list);
        break;
      case "list_moved":
        actions.reorderLists(event.lists);
        break;
      case "list_deleted":
        actions.removeList(event.listId);
        break;
    }
  },
}));
