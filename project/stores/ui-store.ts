import { create } from "zustand";

/**
 * #22 (pass 1) — UI-only state: which task's detail modal is open, and
 * whether its delete-confirmation dialog is open. Deliberately excludes
 * board/task DATA (lists, drag state) — that's board-store.ts's job in
 * pass 2. Kept separate so UI concerns (modals, sidebar, etc.) don't get
 * tangled with data mutations and their persistence/revert logic.
 */
interface UiState {
  openTaskId: string | null;
  deleteTaskOpen: boolean;
  archiveModalOpen: boolean; // Add this

  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;

  openDeleteTaskDialog: () => void;
  closeDeleteTaskDialog: () => void;

  openArchiveModal: () => void; // Add this
  closeArchiveModal: () => void; // Add this

  // #70 item 5 — search & filtering. Pure client-side view state, no
  // server round-trip; board-store already holds every task locally.
  searchQuery: string;
  filterCompleted: "all" | "completed" | "incomplete";
  filterPriority: "all" | "low" | "medium" | "high";
  filterDueDate: "all" | "overdue" | "today" | "this_week" | "none";
  filterAssignedToMe: boolean;
  filterAssigneeId: string | null;

  setSearchQuery: (query: string) => void;
  setFilterCompleted: (value: UiState["filterCompleted"]) => void;
  setFilterPriority: (value: UiState["filterPriority"]) => void;
  setFilterDueDate: (value: UiState["filterDueDate"]) => void;
  setFilterAssignedToMe: (value: boolean) => void;
  setFilterAssigneeId: (value: string | null) => void;
  clearAllFilters: () => void;

  selectionMode: boolean;
  selectedTaskIds: string[];
  bulkDeleteRequestToken: number;
  requestBulkDelete: () => void;

  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleTaskSelected: (taskId: string) => void;
  selectAllVisible: (taskIds: string[]) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  openTaskId: null,
  deleteTaskOpen: false,
  archiveModalOpen: false,
  selectionMode: false,
  selectedTaskIds: [],

  openTaskDetail: (taskId) => set({ openTaskId: taskId }),
  closeTaskDetail: () => set({ openTaskId: null, deleteTaskOpen: false }),

  openDeleteTaskDialog: () => set({ deleteTaskOpen: true }),
  closeDeleteTaskDialog: () => set({ deleteTaskOpen: false }),

  openArchiveModal: () => set({ archiveModalOpen: true }),
  closeArchiveModal: () => set({ archiveModalOpen: false }),

  searchQuery: "",
  filterCompleted: "all",
  filterPriority: "all",
  filterDueDate: "all",
  filterAssignedToMe: false,
  filterAssigneeId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterCompleted: (value) => set({ filterCompleted: value }),
  setFilterPriority: (value) => set({ filterPriority: value }),
  setFilterDueDate: (value) => set({ filterDueDate: value }),
  setFilterAssignedToMe: (value) => set({ filterAssignedToMe: value }),
  setFilterAssigneeId: (value) => set({ filterAssigneeId: value }),
  clearAllFilters: () =>
    set({
      searchQuery: "",
      filterCompleted: "all",
      filterPriority: "all",
      filterDueDate: "all",
      filterAssignedToMe: false,
      filterAssigneeId: null,
    }),

  enterSelectionMode: () => set({ selectionMode: true, selectedTaskIds: [] }),
  exitSelectionMode: () => set({ selectionMode: false, selectedTaskIds: [] }),

  toggleTaskSelected: (taskId) =>
    set((s) => ({
      selectedTaskIds: s.selectedTaskIds.includes(taskId)
        ? s.selectedTaskIds.filter((id) => id !== taskId)
        : [...s.selectedTaskIds, taskId],
    })),

  selectAllVisible: (taskIds) => set({ selectedTaskIds: taskIds }),
  clearSelection: () => set({ selectedTaskIds: [] }),

  bulkDeleteRequestToken: 0,
  requestBulkDelete: () =>
    set((s) => ({ bulkDeleteRequestToken: s.bulkDeleteRequestToken + 1 })),
}));
