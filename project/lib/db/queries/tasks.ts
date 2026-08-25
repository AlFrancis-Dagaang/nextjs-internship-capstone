import type { InferInsertModel } from "drizzle-orm"
import { and, asc, eq, exists, inArray, isNotNull, or, sql } from "drizzle-orm"
import { db } from "../client"
import { comments, lists, projectMembers, projects, tasks } from "../schema"

export const tasksQueries = {
  getByProject: async (projectId: string) => {
    const listsWithTasks = await db.query.lists.findMany({
      where: eq(lists.projectId, projectId),
      with: {
        tasks: { where: eq(tasks.isArchived, false) },
      },
    })

    const allTasks = listsWithTasks.flatMap((list) => list.tasks)
    const taskIds = allTasks.map((t) => t.id)

    if (taskIds.length === 0) {
      return allTasks
    }

    const commentCounts = await db
      .select({
        taskId: comments.taskId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(inArray(comments.taskId, taskIds))
      .groupBy(comments.taskId)

    const countMap = new Map(commentCounts.map((c) => [c.taskId, c.count]))

    return allTasks.map((task) => ({
      ...task,
      commentCount: countMap.get(task.id) ?? 0,
    }))
  },
  getByList: async (listId: string) => {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.listId, listId), eq(tasks.isArchived, false)))
      .orderBy(asc(tasks.position))
  },
  // New — powers the archive modal. Project-scoped (not per-list), per
  // your confirmation that archived tasks show as one global list for
  // the project. Ordered newest-archived-first via updatedAt, since
  // isArchived flips on archive and this is the most recent mutation
  // for an archived task (nothing else updates it while archived).
  getArchivedByProject: async (projectId: string) => {
    const listsWithArchivedTasks = await db.query.lists.findMany({
      where: eq(lists.projectId, projectId),
      with: {
        tasks: { where: eq(tasks.isArchived, true) },
      },
    })

    const archivedTasks = listsWithArchivedTasks
      .flatMap((list) => list.tasks)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    const taskIds = archivedTasks.map((t) => t.id)
    if (taskIds.length === 0) {
      return archivedTasks
    }

    const commentCounts = await db
      .select({
        taskId: comments.taskId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(inArray(comments.taskId, taskIds))
      .groupBy(comments.taskId)

    const countMap = new Map(commentCounts.map((c) => [c.taskId, c.count]))

    return archivedTasks.map((task) => ({
      ...task,
      commentCount: countMap.get(task.id) ?? 0,
    }))
  },
  getById: async (id: string) => {
    return db.query.tasks.findFirst({ where: eq(tasks.id, id) })
  },
  create: async (data: InferInsertModel<typeof tasks>) => {
    const [task] = await db.insert(tasks).values(data).returning()
    return task
  },
  update: async (id: string, data: Partial<InferInsertModel<typeof tasks>>) => {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
    return task
  },
  delete: async (id: string) => {
    await db.delete(tasks).where(eq(tasks.id, id))
  },
  // Added #73 — tasks with a dueDate across every project the user can
  // access (owned or member-of), for the Calendar page. Reimplements
  // getByOwnerOrMember's accessibility check at the task level (join
  // through lists -> projects) rather than importing it, since this
  // needs project name/id alongside each task.
  getWithDueDatesForUser: async (userId: string) => {
    return db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        listId: tasks.listId,
        projectId: lists.projectId,
        projectName: projects.name,
        isCompleted: tasks.isCompleted,
      })
      .from(tasks)
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(projects, eq(lists.projectId, projects.id))
      .where(
        and(
          isNotNull(tasks.dueDate),
          eq(tasks.isArchived, false),
          or(
            eq(projects.ownerId, userId),
            exists(
              db
                .select({ id: projectMembers.id })
                .from(projectMembers)
                .where(
                  and(
                    eq(projectMembers.projectId, projects.id),
                    eq(projectMembers.userId, userId),
                  ),
                ),
            ),
          ),
        ),
      )
  },

  getCompletionStatsByProject: async (projectIds: string[]) => {
    if (projectIds.length === 0) return []

    return db
      .select({
        projectId: lists.projectId,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${tasks.isCompleted})::int`,
      })
      .from(tasks)
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(inArray(lists.projectId, projectIds), eq(tasks.isArchived, false)),
      )
      .groupBy(lists.projectId)
  },
}
