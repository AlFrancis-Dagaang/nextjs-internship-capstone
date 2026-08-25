import { DashboardView } from "@/components/dashboard/dashboard-view"
import { queries } from "@/lib/db"
import { requireAuthedDbUser } from "@/lib/services/auth"
import { getCompletionLabel } from "@/lib/utils/utils"

export type UpcomingItemDTO = {
  id: string
  type: "task" | "event"
  title: string
  date: string // ISO string — cross-RSC-boundary rule (#73/#79/#81)
  projectId: string | null
  projectName: string | null
  priority?: string | null
}

export type ActiveProjectDTO = {
  id: string
  name: string
  completed: number
  total: number
  completionLabel: string
  completionPercent: number // added — matches ProjectCard's exact formula
  dueDate: string | null
}
type AssignedTaskDTO = {
  id: string
  title: string
  dueDate: string | null
  priority: "low" | "medium" | "high" | null // fix here too
  projectId: string
  projectName: string
  listId: string
}

export default async function DashboardPage() {
  const dbUser = await requireAuthedDbUser()

  const [projects, tasksWithDueDates, events, assignedTasks] =
    await Promise.all([
      queries.projects.getByOwnerOrMember(dbUser.id),
      queries.tasks.getWithDueDatesForUser(dbUser.id),
      queries.events.getForUser(dbUser.id),
      queries.taskAssignees.getAssignedToUserAcrossProjects(dbUser.id),
    ])

  const projectIds = projects.map((p) => p.id)
  const completionStats =
    projectIds.length > 0
      ? await queries.tasks.getCompletionStatsByProject(projectIds)
      : []
  const statsByProjectId = new Map(completionStats.map((s) => [s.projectId, s]))

  // --- Upcoming deadlines: merge tasks + events, incomplete/future only ---
  const now = new Date()

  const upcomingTasks: UpcomingItemDTO[] = tasksWithDueDates
    .filter((t) => !t.isCompleted && t.dueDate && t.dueDate >= now)
    .map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      date: t.dueDate ? t.dueDate.toISOString() : new Date().toISOString(),
      projectId: t.projectId,
      projectName: t.projectName,
      priority: t.priority,
    }))

  const upcomingEvents: UpcomingItemDTO[] = events
    .filter((e) => e.startAt >= now)
    .map((e) => ({
      id: e.id,
      type: "event" as const,
      title: e.title,
      date: e.startAt.toISOString(),
      projectId: e.projectId,
      projectName: null, // events query doesn't join project name — fine, project-linked events still show their own icon/badge client-side if needed
    }))

  const upcoming = [...upcomingTasks, ...upcomingEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  const activeProjects: ActiveProjectDTO[] = projects.map((p) => {
    const stats = statsByProjectId.get(p.id)
    const completed = stats?.completed ?? 0
    const total = stats?.total ?? 0
    const completionPercent =
      total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      id: p.id,
      name: p.name,
      completed,
      total,
      completionLabel: getCompletionLabel(total, completed),
      completionPercent,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    }
  })

  // --- Assigned to me: incomplete only, soonest due date first, undated last ---
  const myTasks: AssignedTaskDTO[] = assignedTasks
    .filter((t) => !t.isCompleted)
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.getTime() - b.dueDate.getTime()
    })
    .map((t) => ({
      // 💡 Use t.id (or fallback to a composite string if multiple assignments exist)
      id: t.id ?? (t as any).taskId,
      title: t.title,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      priority: t.priority,
      projectId: t.projectId,
      projectName: t.projectName,
      listId: t.listId,
    }))

  return (
    <DashboardView
      userName={dbUser.name}
      upcoming={upcoming}
      activeProjects={activeProjects}
      assignedTasks={myTasks}
    />
  )
}
