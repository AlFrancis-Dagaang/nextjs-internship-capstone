"use server"

import { queries } from "@/lib/db"
import { getAuthedUserOrError } from "@/lib/services/auth"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type SearchResult = {
  projects: { id: string; name: string }[]
  tasks: {
    id: string
    title: string
    projectId: string
    projectName: string
    isArchived: boolean
  }[]
}

export async function globalSearch(
  query: string,
): Promise<ActionResult<SearchResult>> {
  const authResult = await getAuthedUserOrError()
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" }
  }

  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { success: true, data: { projects: [], tasks: [] } }
  }

  const q = trimmed.toLowerCase()

  // Scoped to projects the user can already see — same access source
  // used everywhere else (project list page, etc).
  const accessibleProjects = await queries.projects.getByOwnerOrMember(
    authResult.user.id,
  )

  const matchingProjects = accessibleProjects
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name }))

  // Task search: loop accessible projects, pull their tasks, filter by
  // title match. Fine at capstone scale (a handful of projects per user);
  // would need a proper cross-project indexed query if this ever needs
  // to scale to hundreds of projects per user.
  const taskResultsNested = await Promise.all(
    accessibleProjects.map(async (project) => {
      const tasks = await queries.tasks.getByProject(project.id)
      return tasks
        .filter((t) => t.title.toLowerCase().includes(q))
        .map((t) => ({
          id: t.id,
          title: t.title,
          projectId: project.id,
          projectName: project.name,
          isArchived: t.isArchived,
        }))
    }),
  )

  const matchingTasks = taskResultsNested.flat().slice(0, 8)

  return {
    success: true,
    data: { projects: matchingProjects, tasks: matchingTasks },
  }
}
