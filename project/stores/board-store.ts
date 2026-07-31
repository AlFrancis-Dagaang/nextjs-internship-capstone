// TODO: Task 5.3 - Set up client-side state management with Zustand
// TODO: Task 5.4 - Implement optimistic UI updates for smooth interactions

/*
TODO: Implementation Notes for Interns:

Board state management for Kanban functionality:
- Current project data
- Lists/columns
- Tasks
- Drag and drop state
- Optimistic updates
- Sync with server

Key features:
- Optimistic task creation/updates
- Drag and drop state management
- Real-time synchronization
- Conflict resolution
- Offline support (optional)

Example structure:
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface BoardState {
  // Data
  currentProject: Project | null
  lists: List[]
  tasks: Task[]
  
  // UI state
  draggedTask: Task | null
  draggedOverList: string | null
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  
  // Actions
  loadProject: (projectId: string) => Promise<void>
  createTask: (listId: string, task: Partial<Task>) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  moveTask: (taskId: string, newListId: string, newPosition: number) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  
  // Drag and drop
  setDraggedTask: (task: Task | null) => void
  setDraggedOverList: (listId: string | null) => void
}

export const useBoardStore = create<BoardState>()(
  subscribeWithSelector((set, get) => ({
    // ... implementation
  }))
)
*/

import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { List, Task } from "@/lib/db/schema";
import type {
  ListWithTasks,
  TaskWithCommentCount,
} from "@/components/lists/board";

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

  addTask: (listId: string, task: Task) => void;
  updateTaskLocal: (task: Task) => void;
  removeTask: (listId: string, taskId: string) => void;
  reconcileTaskMoved: (movedTask: Task, affectedTasks: Task[]) => void;
  changeCommentCount: (taskId: string, delta: number) => void;

  startDrag: (taskId: string) => void;
  clearActiveTask: () => void;
  dragOver: (activeId: string, overId: string) => void;
  endDrag: (
    activeId: string,
    overId: string,
  ) => { finalListId: string; finalPosition: number } | null;
  revertToSnapshot: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  lists: [],
  activeTask: null,
  dragSnapshot: null,

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
      lists: s.lists.map((l) =>
        l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l,
      ),
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
              tasks: l.tasks.map((t) =>
                t.id === task.id
                  ? { ...task, commentCount: t.commentCount }
                  : t,
              ),
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

  // Same #24 fix as updateTaskLocal, for moveTaskToList's affectedTasks.
  reconcileTaskMoved: (movedTask, affectedTasks) =>
    set((s) => {
      const commentCountMap = new Map(
        s.lists.flatMap((l) => l.tasks).map((t) => [t.id, t.commentCount]),
      );
      const affectedListIds = new Set(affectedTasks.map((t) => t.listId));
      return {
        lists: s.lists.map((l) => {
          if (!affectedListIds.has(l.id)) return l;
          const tasksForThisList = affectedTasks
            .filter((t) => t.listId === l.id)
            .sort((a, b) => a.position - b.position)
            .map((t) => ({ ...t, commentCount: commentCountMap.get(t.id) }));
          return { ...l, tasks: tasksForThisList };
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
      if (!sourceList || !destList || sourceList.id === destList.id) return s;

      const task = sourceList.tasks.find((t) => t.id === activeId);
      if (!task) return s;

      const overTaskIndex = destList.tasks.findIndex((t) => t.id === overId);
      const insertIndex =
        overTaskIndex >= 0 ? overTaskIndex : destList.tasks.length;
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
}));
