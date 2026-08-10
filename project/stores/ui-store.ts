// TODO: Task 5.3 - Set up client-side state management with Zustand

/*
TODO: Implementation Notes for Interns:

UI state management store for:
- Modal states (create project, create task, etc.)
- Sidebar state
- Theme preferences
- Loading states
- Error states
- Notifications/toasts

Install: pnpm add zustand

Example structure:
import { create } from 'zustand'

interface UIState {
  // Modal states
  isCreateProjectModalOpen: boolean
  isCreateTaskModalOpen: boolean
  isTaskDetailModalOpen: boolean
  selectedTaskId: string | null

  // UI states
  sidebarOpen: boolean
  theme: 'light' | 'dark'

  // Loading states
  isLoading: boolean
  loadingMessage: string

  // Actions
  openCreateProjectModal: () => void
  closeCreateProjectModal: () => void
  openCreateTaskModal: () => void
  closeCreateTaskModal: () => void
  openTaskDetailModal: (taskId: string) => void
  closeTaskDetailModal: () => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  // ... implementation
}))
*/

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
}

export const useUiStore = create<UiState>((set) => ({
  openTaskId: null,
  deleteTaskOpen: false,
  archiveModalOpen: false,

  openTaskDetail: (taskId) => set({ openTaskId: taskId }),
  closeTaskDetail: () => set({ openTaskId: null, deleteTaskOpen: false }),

  openDeleteTaskDialog: () => set({ deleteTaskOpen: true }),
  closeDeleteTaskDialog: () => set({ deleteTaskOpen: false }),

  openArchiveModal: () => set({ archiveModalOpen: true }),
  closeArchiveModal: () => set({ archiveModalOpen: false }),
}));
