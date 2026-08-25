import { CalendarView } from "@/components/calendar/calendar-view"
import { queries } from "@/lib/db"
import { requireAuthedDbUser } from "@/lib/services/auth"
import { toLocalDateKey } from "@/lib/utils/utils"
import type {
  CalendarEventDTO,
  CalendarProjectDTO,
  CalendarTaskDTO,
} from "@/types"

export default async function CalendarPage() {
  const user = await requireAuthedDbUser()

  const [tasks, events, projectsWithDueDates] = await Promise.all([
    queries.tasks.getWithDueDatesForUser(user.id),
    queries.events.getForUser(user.id),
    queries.projects.getWithDueDatesForUser(user.id),
  ])

  const tasksByDate: Record<string, CalendarTaskDTO[]> = {}
  for (const task of tasks) {
    if (!task.dueDate) continue
    // Fixed: was .toISOString().slice(0, 10) — UTC date, which can
    // disagree with CalendarView's local-date grid cells near
    // timezone/midnight boundaries.
    const key = toLocalDateKey(task.dueDate)
    if (!tasksByDate[key]) {
      tasksByDate[key] = []
    }
    tasksByDate[key].push({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority,
      projectId: task.projectId,
      projectName: task.projectName,
      isCompleted: task.isCompleted,
    })
  }

  const eventsByDate: Record<string, CalendarEventDTO[]> = {}
  for (const event of events) {
    // Same fix — group by the event's local start date, matching
    // CalendarView's grid.
    const key = toLocalDateKey(event.startAt)
    if (!eventsByDate[key]) {
      eventsByDate[key] = []
    }
    eventsByDate[key].push({
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      projectId: event.projectId,
      creatorId: event.creatorId,
    })
  }

  const projectsByDate: Record<string, CalendarProjectDTO[]> = {}
  for (const project of projectsWithDueDates) {
    if (!project.dueDate) continue
    const key = toLocalDateKey(project.dueDate)
    if (!projectsByDate[key]) {
      projectsByDate[key] = []
    }
    projectsByDate[key].push({
      id: project.id,
      name: project.name,
      dueDate: project.dueDate.toISOString(),
    })
  }

  return (
    <CalendarView
      tasksByDate={tasksByDate}
      eventsByDate={eventsByDate}
      projectsByDate={projectsByDate} // new
      currentUserId={user.id}
    />
  )
}
