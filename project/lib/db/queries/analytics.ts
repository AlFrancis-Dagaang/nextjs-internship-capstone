import { and, eq, gte, lte, inArray, sql, desc } from "drizzle-orm";
import { db } from "../client";
import { lists, taskActivity, tasks, users } from "../schema";

export type DateRange = { start: Date; end: Date };

export const analyticsQueries = {
  // Project Velocity — count of "completed" activity entries within
  // the given range, across the given projects.
  getVelocity: async (projectIds: string[], range: DateRange) => {
    if (projectIds.length === 0) return 0;
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          eq(taskActivity.action, "completed"),
          gte(taskActivity.createdAt, range.start),
          lte(taskActivity.createdAt, range.end),
        ),
      );
    return row?.count ?? 0;
  },

  // Active Users — distinct actors with ANY activity in the given
  // range, across the given projects.
  getActiveUserCount: async (projectIds: string[], range: DateRange) => {
    if (projectIds.length === 0) return 0;
    const [row] = await db
      .select({
        count: sql<number>`count(distinct ${taskActivity.actorId})::int`,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          gte(taskActivity.createdAt, range.start),
          lte(taskActivity.createdAt, range.end),
        ),
      );
    return row?.count ?? 0;
  },

  // Avg Task Time — mean of (earliest "completed" activity createdAt
  // minus task.createdAt), in days, for tasks whose first completion
  // falls within the given range. Same reopened-task rationale as #75
  // (earliest completion = "time to first finish").
  getAvgTaskCompletionDays: async (projectIds: string[], range: DateRange) => {
    if (projectIds.length === 0) return null;

    const firstCompletions = db
      .select({
        taskId: taskActivity.taskId,
        completedAt: sql<Date>`min(${taskActivity.createdAt})`.as(
          "completed_at",
        ),
      })
      .from(taskActivity)
      .where(eq(taskActivity.action, "completed"))
      .groupBy(taskActivity.taskId)
      .as("first_completions");

    const [row] = await db
      .select({
        avgDays: sql<
          number | null
        >`avg(extract(epoch from (${firstCompletions.completedAt} - ${tasks.createdAt})) / 86400.0)`,
      })
      .from(firstCompletions)
      .innerJoin(tasks, eq(firstCompletions.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          gte(firstCompletions.completedAt, range.start),
          lte(firstCompletions.completedAt, range.end),
        ),
      );

    return row?.avgDays ?? null;
  },

  // Team Activity chart — daily activity counts within the given
  // range. Only returns days with rows — caller gap-fills.
  getDailyActivityCounts: async (projectIds: string[], range: DateRange) => {
    if (projectIds.length === 0) return [];
    return db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${taskActivity.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          gte(taskActivity.createdAt, range.start),
          lte(taskActivity.createdAt, range.end),
        ),
      )
      .groupBy(sql`date_trunc('day', ${taskActivity.createdAt})`)
      .orderBy(sql`date_trunc('day', ${taskActivity.createdAt})`);
  },

  // New for #82a — completion % "as of" a point in time, keyed off
  // each task's earliest "completed" activity entry. Caveat: archival
  // state isn't snapshotted historically, so this reflects tasks that
  // are *currently* non-archived and were created by `asOf` — a task
  // archived after `asOf` but before now is excluded from a past
  // snapshot even though it existed then. Fine for a trend delta, not
  // audit-grade. Mirrors #75's accepted UTC/date_trunc caveat in spirit.
  getCompletionStatsByProjectAsOf: async (projectIds: string[], asOf: Date) => {
    if (projectIds.length === 0) return [];

    const firstCompletions = db
      .select({
        taskId: taskActivity.taskId,
        completedAt: sql<Date>`min(${taskActivity.createdAt})`.as(
          "completed_at",
        ),
      })
      .from(taskActivity)
      .where(eq(taskActivity.action, "completed"))
      .groupBy(taskActivity.taskId)
      .as("first_completions");

    return db
      .select({
        projectId: lists.projectId,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${firstCompletions.completedAt} is not null and ${firstCompletions.completedAt} <= ${asOf})::int`,
      })
      .from(tasks)
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .leftJoin(firstCompletions, eq(firstCompletions.taskId, tasks.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          eq(tasks.isArchived, false),
          lte(tasks.createdAt, asOf),
        ),
      )
      .groupBy(lists.projectId);
  },
  // Velocity drill-down — the actual "completed" activity rows feeding
  // the count.
  getCompletedActivityDetails: async (
    projectIds: string[],
    range: DateRange,
    limit = 50,
  ) => {
    if (projectIds.length === 0) return [];
    return db
      .select({
        id: taskActivity.id,
        taskId: taskActivity.taskId,
        taskTitle: tasks.title,
        projectId: lists.projectId,
        actorName: users.name,
        createdAt: taskActivity.createdAt,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          eq(taskActivity.action, "completed"),
          gte(taskActivity.createdAt, range.start),
          lte(taskActivity.createdAt, range.end),
        ),
      )
      .orderBy(desc(taskActivity.createdAt))
      .limit(limit);
  },

  // Active Users drill-down — per-actor action counts in range.
  getActiveActorsSummary: async (projectIds: string[], range: DateRange) => {
    if (projectIds.length === 0) return [];
    return db
      .select({
        actorId: taskActivity.actorId,
        actorName: users.name,
        actionCount: sql<number>`count(*)::int`,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          gte(taskActivity.createdAt, range.start),
          lte(taskActivity.createdAt, range.end),
        ),
      )
      .groupBy(taskActivity.actorId, users.name)
      .orderBy(desc(sql`count(*)`));
  },

  // Avg Task Time drill-down — per-task duration, longest first. Same
  // first-completion-in-range logic as getAvgTaskCompletionDays.
  getTaskCompletionDurations: async (
    projectIds: string[],
    range: DateRange,
    limit = 50,
  ) => {
    if (projectIds.length === 0) return [];

    const firstCompletions = db
      .select({
        taskId: taskActivity.taskId,
        completedAt: sql<Date>`min(${taskActivity.createdAt})`.as(
          "completed_at",
        ),
      })
      .from(taskActivity)
      .where(eq(taskActivity.action, "completed"))
      .groupBy(taskActivity.taskId)
      .as("first_completions");

    return db
      .select({
        taskId: tasks.id,
        title: tasks.title,
        projectId: lists.projectId,
        durationDays: sql<number>`extract(epoch from (${firstCompletions.completedAt} - ${tasks.createdAt})) / 86400.0`,
      })
      .from(firstCompletions)
      .innerJoin(tasks, eq(firstCompletions.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          gte(firstCompletions.completedAt, range.start),
          lte(firstCompletions.completedAt, range.end),
        ),
      )
      .orderBy(
        desc(
          sql`extract(epoch from (${firstCompletions.completedAt} - ${tasks.createdAt}))`,
        ),
      )
      .limit(limit);
  },

  // Team Activity chart-point drill-down — every activity row on one
  // specific day (uses the same date_trunc/to_char comparison as
  // getDailyActivityCounts, so the day key it returns lines up exactly
  // with the day key clicked on the chart).
  getActivityByDay: async (projectIds: string[], day: string) => {
    if (projectIds.length === 0) return [];
    return db
      .select({
        id: taskActivity.id,
        taskId: taskActivity.taskId,
        taskTitle: tasks.title,
        projectId: lists.projectId,
        action: taskActivity.action,
        actorName: users.name,
        createdAt: taskActivity.createdAt,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          sql`to_char(date_trunc('day', ${taskActivity.createdAt}), 'YYYY-MM-DD') = ${day}`,
        ),
      )
      .orderBy(desc(taskActivity.createdAt));
  },
  // Per-member breakdown — completed count, active days, avg resolution
  // time, scoped to the given projects/range. Uses a CTE with
  // row_number() to isolate each task's EARLIEST "completed" activity
  getMemberBreakdown: async (projectIds: string[], range: DateRange) => {
    if (projectIds.length === 0) return [];

    const rankedCompletions = db.$with("ranked_completions").as(
      db
        .select({
          taskId: taskActivity.taskId,
          actorId: taskActivity.actorId,
          completedAt: sql<Date>`${taskActivity.createdAt}`.as("completed_at"),
          taskCreatedAt: sql<Date>`${tasks.createdAt}`.as("task_created_at"),
          projectId: lists.projectId,
          rn: sql<number>`row_number() over (partition by ${taskActivity.taskId} order by ${taskActivity.createdAt} asc)`.as(
            "rn",
          ),
        })
        .from(taskActivity)
        .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
        .innerJoin(lists, eq(tasks.listId, lists.id))
        .where(eq(taskActivity.action, "completed")),
    );

    const completedStats = await db
      .with(rankedCompletions)
      .select({
        actorId: rankedCompletions.actorId,
        completedCount: sql<number>`count(*)::int`,
        avgResolutionDays: sql<
          number | null
        >`avg(extract(epoch from (${rankedCompletions.completedAt} - ${rankedCompletions.taskCreatedAt})) / 86400.0)`,
      })
      .from(rankedCompletions)
      .where(
        and(
          eq(rankedCompletions.rn, 1),
          inArray(rankedCompletions.projectId, projectIds),
          sql`${rankedCompletions.completedAt} >= ${range.start}`,
          sql`${rankedCompletions.completedAt} <= ${range.end}`,
        ),
      )
      .groupBy(rankedCompletions.actorId);

    const activeDaysRows = await db
      .select({
        actorId: taskActivity.actorId,
        activeDays: sql<number>`count(distinct date_trunc('day', ${taskActivity.createdAt}))::int`,
      })
      .from(taskActivity)
      .innerJoin(tasks, eq(taskActivity.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          inArray(lists.projectId, projectIds),
          gte(taskActivity.createdAt, range.start),
          lte(taskActivity.createdAt, range.end),
        ),
      )
      .groupBy(taskActivity.actorId);

    const completedMap = new Map(completedStats.map((r) => [r.actorId, r]));
    const activeDaysMap = new Map(
      activeDaysRows.map((r) => [r.actorId, r.activeDays]),
    );
    const actorIds = new Set([...completedMap.keys(), ...activeDaysMap.keys()]);

    return Array.from(actorIds).map((actorId) => {
      const completed = completedMap.get(actorId);
      return {
        actorId,
        completedCount: completed?.completedCount ?? 0,
        avgResolutionDays: completed?.avgResolutionDays ?? null,
        activeDays: activeDaysMap.get(actorId) ?? 0,
      };
    });
  },
};
