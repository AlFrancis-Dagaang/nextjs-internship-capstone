// stores/task-detail-store.ts
import { create } from "zustand"
import type { TaskWithCommentCount } from "@/components/lists/board"

interface TaskDetailState {
  isOpen: boolean
  task: TaskWithCommentCount | null
  projectId: string | null
  activeTab: "details" | "sidebar"
  activityRefreshKey: number

  openModal: (task: TaskWithCommentCount, projectId: string) => void
  closeModal: () => void
  setActiveTab: (tab: "details" | "sidebar") => void
  bumpActivity: () => void
  updateTaskLocal: (updated: TaskWithCommentCount) => void
}

export const useTaskDetailStore = create<TaskDetailState>((set) => ({
  isOpen: false,
  task: null,
  projectId: null,
  activeTab: "details",
  activityRefreshKey: 0,

  openModal: (task, projectId) =>
    set({
      isOpen: true,
      task,
      projectId,
      activeTab: "details",
      activityRefreshKey: 0,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      task: null,
      projectId: null,
    }),

  setActiveTab: (activeTab) => set({ activeTab }),

  bumpActivity: () =>
    set((state) => ({ activityRefreshKey: state.activityRefreshKey + 1 })),

  updateTaskLocal: (updated) =>
    set((state) => ({
      task: state.task ? { ...state.task, ...updated } : null,
    })),
}))
