export type CalendarTaskDTO = {
  id: string
  title: string
  dueDate: string // ISO string
  priority: "low" | "medium" | "high" | null
  projectId: string
  projectName: string
  isCompleted: boolean
}

export type CalendarEventDTO = {
  id: string
  title: string
  description: string | null
  startAt: string // ISO string
  endAt: string // ISO string
  projectId: string | null
  creatorId: string
}

export type CalendarProjectDTO = {
  id: string
  name: string
  dueDate: string // ISO string
}
