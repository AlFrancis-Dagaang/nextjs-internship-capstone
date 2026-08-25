"use server";

import { queries } from "@/lib/db";
import type { DateRange } from "@/lib/db/queries/analytics";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { getCompletionLabel } from "@/lib/utils/utils";
import {
  type AnalyticsFiltersInput,
  analyticsFiltersSchema,
  drillDownDaySchema,
  drillDownRangeSchema,
} from "@/lib/validations";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type MetricWithDelta = {
  value: number | null;
  // Percent change vs. the prior equivalent period. null = no baseline
  // to compare against (prior period had zero and current is nonzero,
  // or a query returned null e.g. no completed tasks yet).
  deltaPercent: number | null;
};

export type AnalyticsData = {
  velocity: MetricWithDelta;
  teamEfficiency: MetricWithDelta & { label: string };
  activeUsers: MetricWithDelta;
  avgTaskDays: MetricWithDelta;
  projectProgress: {
    projectId: string;
    projectName: string;
    percent: number;
  }[];
  teamActivity: { day: string; count: number }[];
  availableProjects: { id: string; name: string }[];
  appliedFilters: {
    startDate: string; // yyyy-mm-dd
    endDate: string;
    projectId: string | null; // null = "All Projects"
  };
};

const DEFAULT_WINDOW_DAYS = 14; // matches #75's original fixed window

function computeRanges(filters: AnalyticsFiltersInput): {
  current: DateRange;
  prior: DateRange;
} {
  const end = filters.endDate ?? new Date();
  const start =
    filters.startDate ??
    new Date(end.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const spanMs = end.getTime() - start.getTime();
  const priorEnd = new Date(start.getTime() - 1);
  const priorStart = new Date(priorEnd.getTime() - spanMs);

  return {
    current: { start, end },
    prior: { start: priorStart, end: priorEnd },
  };
}

function deltaPercent(
  current: number | null,
  prior: number | null,
): number | null {
  if (current === null || prior === null) return null;
  if (prior === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prior) / prior) * 1000) / 10; // one decimal
}

function fillGaps(
  daily: { day: string; count: number }[],
  range: DateRange,
): { day: string; count: number }[] {
  const map = new Map(daily.map((d) => [d.day, d.count]));
  const result: { day: string; count: number }[] = [];
  const cursor = new Date(range.start);
  while (cursor <= range.end) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ day: key, count: map.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function getAnalytics(
  rawFilters?: unknown,
): Promise<ActionResult<AnalyticsData>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = analyticsFiltersSchema.safeParse(rawFilters ?? {});
  if (!parsed.success) {
    return { success: false, error: "Invalid filters" };
  }
  const filters = parsed.data;

  const accessibleProjects = await queries.projects.getByOwnerOrMember(
    authResult.user.id,
  );

  // A projectId filter must resolve to a project this user can access —
  // silently ignoring an invalid id would be confusing, trusting an
  // arbitrary client-supplied id would leak cross-user data.
  let scopedProjects = accessibleProjects;
  if (filters.projectId) {
    const match = accessibleProjects.find((p) => p.id === filters.projectId);
    if (!match) {
      return { success: false, error: "Project not found or not accessible" };
    }
    scopedProjects = [match];
  }
  const projectIds = scopedProjects.map((p) => p.id);

  const { current, prior } = computeRanges(filters);

  const [
    velocityNow,
    velocityPrior,
    activeUsersNow,
    activeUsersPrior,
    avgTaskDaysNow,
    avgTaskDaysPrior,
    completionStatsNow,
    completionStatsPrior,
    dailyActivity,
  ] = await Promise.all([
    queries.analytics.getVelocity(projectIds, current),
    queries.analytics.getVelocity(projectIds, prior),
    queries.analytics.getActiveUserCount(projectIds, current),
    queries.analytics.getActiveUserCount(projectIds, prior),
    queries.analytics.getAvgTaskCompletionDays(projectIds, current),
    queries.analytics.getAvgTaskCompletionDays(projectIds, prior),
    queries.analytics.getCompletionStatsByProjectAsOf(projectIds, current.end),
    queries.analytics.getCompletionStatsByProjectAsOf(projectIds, prior.end),
    queries.analytics.getDailyActivityCounts(projectIds, current),
  ]);

  const sumStats = (stats: { total: number; completed: number }[]) =>
    stats.reduce(
      (acc, s) => ({
        total: acc.total + s.total,
        completed: acc.completed + s.completed,
      }),
      { total: 0, completed: 0 },
    );

  const totalsNow = sumStats(completionStatsNow);
  const totalsPrior = sumStats(completionStatsPrior);
  const efficiencyNowPct =
    totalsNow.total > 0 ? (totalsNow.completed / totalsNow.total) * 100 : null;
  const efficiencyPriorPct =
    totalsPrior.total > 0
      ? (totalsPrior.completed / totalsPrior.total) * 100
      : null;

  const projectProgress = scopedProjects.map((p) => {
    const stat = completionStatsNow.find((s) => s.projectId === p.id);
    const total = stat?.total ?? 0;
    const completed = stat?.completed ?? 0;
    return {
      projectId: p.id,
      projectName: p.name,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return {
    success: true,
    data: {
      velocity: {
        value: velocityNow,
        deltaPercent: deltaPercent(velocityNow, velocityPrior),
      },
      teamEfficiency: {
        value: efficiencyNowPct !== null ? Math.round(efficiencyNowPct) : null,
        deltaPercent: deltaPercent(efficiencyNowPct, efficiencyPriorPct),
        label: getCompletionLabel(totalsNow.total, totalsNow.completed),
      },
      activeUsers: {
        value: activeUsersNow,
        deltaPercent: deltaPercent(activeUsersNow, activeUsersPrior),
      },
      avgTaskDays: {
        value:
          avgTaskDaysNow !== null ? Math.round(avgTaskDaysNow * 10) / 10 : null,
        deltaPercent: deltaPercent(avgTaskDaysNow, avgTaskDaysPrior),
      },
      projectProgress,
      teamActivity: fillGaps(dailyActivity, current),
      availableProjects: accessibleProjects.map((p) => ({
        id: p.id,
        name: p.name,
      })),
      appliedFilters: {
        startDate: current.start.toISOString().slice(0, 10),
        endDate: current.end.toISOString().slice(0, 10),
        projectId: filters.projectId ?? null,
      },
    },
  };
}

// ---- shared scoping helper ----

async function resolveScopedProjects(
  userId: string,
  projectIdFilter?: string,
): Promise<
  | { projectIds: string[]; projectsById: Map<string, string> }
  | { error: string }
> {
  const accessible = await queries.projects.getByOwnerOrMember(userId);
  const projectsById = new Map(accessible.map((p) => [p.id, p.name]));

  if (projectIdFilter) {
    if (!projectsById.has(projectIdFilter)) {
      return { error: "Project not found or not accessible" };
    }
    return { projectIds: [projectIdFilter], projectsById };
  }

  return { projectIds: accessible.map((p) => p.id), projectsById };
}

// ---- Project Progress bar drill-down ----

export type ProjectDrillDown = {
  projectId: string;
  projectName: string;
  open: {
    id: string;
    title: string;
    priority: string | null;
    dueDate: string | null;
  }[];
  completed: {
    id: string;
    title: string;
    priority: string | null;
    dueDate: string | null;
  }[];
};

export async function getProjectDrillDown(
  projectId: string,
): Promise<ActionResult<ProjectDrillDown>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const scoped = await resolveScopedProjects(authResult.user.id, projectId);
  if ("error" in scoped) return { success: false, error: scoped.error };

  const allTasks = await queries.tasks.getByProject(projectId);
  const toRow = (t: (typeof allTasks)[number]) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
  });

  return {
    success: true,
    data: {
      projectId,
      projectName: scoped.projectsById.get(projectId) ?? "",
      open: allTasks.filter((t) => !t.isCompleted).map(toRow),
      completed: allTasks.filter((t) => t.isCompleted).map(toRow),
    },
  };
}

// ---- Team Activity point drill-down ----

export type DayActivityDrillDown = {
  day: string;
  entries: {
    id: string;
    action: string;
    actorName: string;
    taskTitle: string;
    projectName: string;
    createdAt: string;
  }[];
};

export async function getDayActivityDrillDown(
  rawInput: unknown,
): Promise<ActionResult<DayActivityDrillDown>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = drillDownDaySchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const { day, projectId } = parsed.data;

  const scoped = await resolveScopedProjects(authResult.user.id, projectId);
  if ("error" in scoped) return { success: false, error: scoped.error };

  const rows = await queries.analytics.getActivityByDay(scoped.projectIds, day);

  return {
    success: true,
    data: {
      day,
      entries: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actorName: r.actorName,
        taskTitle: r.taskTitle,
        projectName: scoped.projectsById.get(r.projectId) ?? "",
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}

// ---- Velocity card drill-down ----

export type VelocityDrillDown = {
  entries: {
    id: string;
    taskTitle: string;
    projectName: string;
    actorName: string;
    createdAt: string;
  }[];
};

export async function getVelocityDrillDown(
  rawInput: unknown,
): Promise<ActionResult<VelocityDrillDown>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = drillDownRangeSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const { startDate, endDate, projectId } = parsed.data;

  const scoped = await resolveScopedProjects(authResult.user.id, projectId);
  if ("error" in scoped) return { success: false, error: scoped.error };

  const rows = await queries.analytics.getCompletedActivityDetails(
    scoped.projectIds,
    { start: startDate, end: endDate },
  );

  return {
    success: true,
    data: {
      entries: rows.map((r) => ({
        id: r.id,
        taskTitle: r.taskTitle,
        projectName: scoped.projectsById.get(r.projectId) ?? "",
        actorName: r.actorName,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}

// ---- Active Users card drill-down ----

export type ActiveUsersDrillDown = {
  members: { actorId: string; name: string; actionCount: number }[];
};

export async function getActiveUsersDrillDown(
  rawInput: unknown,
): Promise<ActionResult<ActiveUsersDrillDown>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = drillDownRangeSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const { startDate, endDate, projectId } = parsed.data;

  const scoped = await resolveScopedProjects(authResult.user.id, projectId);
  if ("error" in scoped) return { success: false, error: scoped.error };

  const rows = await queries.analytics.getActiveActorsSummary(
    scoped.projectIds,
    { start: startDate, end: endDate },
  );

  return {
    success: true,
    data: {
      members: rows.map((r) => ({
        actorId: r.actorId,
        name: r.actorName,
        actionCount: r.actionCount,
      })),
    },
  };
}

// ---- Avg Task Time card drill-down ----

export type AvgTaskTimeDrillDown = {
  tasks: {
    taskId: string;
    title: string;
    projectName: string;
    durationDays: number;
  }[];
};

export async function getAvgTaskTimeDrillDown(
  rawInput: unknown,
): Promise<ActionResult<AvgTaskTimeDrillDown>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = drillDownRangeSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const { startDate, endDate, projectId } = parsed.data;

  const scoped = await resolveScopedProjects(authResult.user.id, projectId);
  if ("error" in scoped) return { success: false, error: scoped.error };

  const rows = await queries.analytics.getTaskCompletionDurations(
    scoped.projectIds,
    { start: startDate, end: endDate },
  );

  return {
    success: true,
    data: {
      tasks: rows.map((r) => ({
        taskId: r.taskId,
        title: r.title,
        projectName: scoped.projectsById.get(r.projectId) ?? "",
        durationDays: Math.round(r.durationDays * 10) / 10,
      })),
    },
  };
}
export type MemberBreakdownRow = {
  userId: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  hasImage?: boolean | null; // <-- Add this property
  completedCount: number;
  activeDays: number;
  avgResolutionDays: number | null;
};

export type MemberBreakdownData = {
  members: MemberBreakdownRow[]; // sorted by completedCount desc
  teamAverage: {
    completedCount: number;
    activeDays: number;
    avgResolutionDays: number | null; // null if no one completed anything
  };
};

export async function getMemberBreakdown(
  rawInput: unknown,
): Promise<ActionResult<MemberBreakdownData>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = drillDownRangeSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const { startDate, endDate, projectId } = parsed.data;

  const accessibleProjects = await queries.projects.getByOwnerOrMember(
    authResult.user.id,
  );
  let scopedProjects = accessibleProjects;
  if (projectId) {
    const match = accessibleProjects.find((p) => p.id === projectId);
    if (!match) {
      return { success: false, error: "Project not found or not accessible" };
    }
    scopedProjects = [match];
  }
  const projectIds = scopedProjects.map((p) => p.id);

  const [statsRows, peopleMap] = await Promise.all([
    queries.analytics.getMemberBreakdown(projectIds, {
      start: startDate,
      end: endDate,
    }),
    getEffectivePeopleForProjects(scopedProjects),
  ]);

  const statsMap = new Map(statsRows.map((r) => [r.actorId, r]));

  const members: MemberBreakdownRow[] = Array.from(peopleMap.entries())
    .map(([userId, info]) => {
      const stats = statsMap.get(userId);
      return {
        userId,
        name: info.name,
        email: info.email,
        imageUrl: info.imageUrl ?? null,
        hasImage: info.hasImage ?? false, // <-- Pass hasImage here
        completedCount: stats?.completedCount ?? 0,
        activeDays: stats?.activeDays ?? 0,
        avgResolutionDays:
          stats?.avgResolutionDays != null
            ? Math.round(stats.avgResolutionDays * 10) / 10
            : null,
      };
    })
    .sort((a, b) => b.completedCount - a.completedCount);

  const withResolution = members.filter((m) => m.avgResolutionDays !== null);
  const avg = (nums: number[]) =>
    nums.length > 0
      ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
      : 0;

  const teamAverage = {
    completedCount: avg(members.map((m) => m.completedCount)),
    activeDays: avg(members.map((m) => m.activeDays)),
    avgResolutionDays:
      withResolution.length > 0
        ? avg(withResolution.map((m) => m.avgResolutionDays as number))
        : null,
  };

  return { success: true, data: { members, teamAverage } };
}

// ---- shared: effective people across scoped projects ----

async function getEffectivePeopleForProjects(
  scopedProjects: { id: string; ownerId: string }[],
): Promise<
  Map<
    string,
    {
      name: string;
      email: string;
      imageUrl: string | null;
      hasImage: boolean | null;
    }
  >
> {
  const peopleMap = new Map<
    string,
    {
      name: string;
      email: string;
      imageUrl: string | null;
      hasImage: boolean | null;
    }
  >();

  const perProject = await Promise.all(
    scopedProjects.map(async (p) => {
      const [owner, members, projectTeams] = await Promise.all([
        queries.users.getById(p.ownerId),
        queries.projectMembers.getByProject(p.id),
        queries.projectTeams.getByProject(p.id),
      ]);
      const teamMemberLists = await Promise.all(
        projectTeams.map((pt) => queries.teams.getMembers(pt.teamId)),
      );
      return [
        ...(owner
          ? [
              {
                userId: owner.id,
                name: owner.name,
                email: owner.email,
                imageUrl: owner.imageUrl ?? null,
                hasImage: (owner as any).hasImage ?? null,
              },
            ]
          : []),
        ...members.map((m: any) => ({
          userId: m.userId,
          name: m.userName,
          email: m.userEmail,
          imageUrl: m.userImageUrl ?? m.imageUrl ?? null,
          hasImage: m.userHasImage ?? m.hasImage ?? null,
        })),
        ...teamMemberLists.flat().map((m: any) => ({
          userId: m.userId,
          name: m.userName,
          email: m.userEmail,
          imageUrl: m.userImageUrl ?? m.imageUrl ?? null,
          hasImage: m.userHasImage ?? m.hasImage ?? null,
        })),
      ];
    }),
  );

  for (const p of perProject.flat()) {
    if (!peopleMap.has(p.userId)) {
      peopleMap.set(p.userId, {
        name: p.name,
        email: p.email,
        imageUrl: p.imageUrl,
        hasImage: p.hasImage,
      });
    }
  }

  return peopleMap;
}
export type TeamBreakdownRow = {
  teamId: string;
  teamName: string;
  memberCount: number;
  completedCount: number; // sum across the team's members
  activeDays: number; // avg across the team's members
  avgResolutionDays: number | null;
};

export type TeamBreakdownData = {
  teams: TeamBreakdownRow[]; // sorted by completedCount desc
};

export async function getTeamBreakdown(
  rawInput: unknown,
): Promise<ActionResult<TeamBreakdownData>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = drillDownRangeSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const { startDate, endDate, projectId } = parsed.data;

  const accessibleProjects = await queries.projects.getByOwnerOrMember(
    authResult.user.id,
  );
  let scopedProjects = accessibleProjects;
  if (projectId) {
    const match = accessibleProjects.find((p) => p.id === projectId);
    if (!match) {
      return { success: false, error: "Project not found or not accessible" };
    }
    scopedProjects = [match];
  }
  const projectIds = scopedProjects.map((p) => p.id);

  const [statsRows, projectTeamsPerProject] = await Promise.all([
    queries.analytics.getMemberBreakdown(projectIds, {
      start: startDate,
      end: endDate,
    }),
    Promise.all(
      scopedProjects.map((p) => queries.projectTeams.getByProject(p.id)),
    ),
  ]);

  const statsMap = new Map(statsRows.map((r) => [r.actorId, r]));

  // Dedupe teams (same team could be attached to multiple scoped projects).
  const teamsById = new Map<string, string>(); // teamId -> teamName
  for (const pt of projectTeamsPerProject.flat()) {
    teamsById.set(pt.teamId, pt.teamName);
  }

  const teamMemberLists = await Promise.all(
    Array.from(teamsById.keys()).map((teamId) =>
      queries.teams.getMembers(teamId),
    ),
  );

  const avg = (nums: number[]) =>
    nums.length > 0
      ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
      : 0;

  const teams: TeamBreakdownRow[] = Array.from(teamsById.entries())
    .map(([teamId, teamName], i) => {
      const members = teamMemberLists[i];
      const memberStats = members.map((m) => statsMap.get(m.userId));

      const completedCount = memberStats.reduce(
        (sum, s) => sum + (s?.completedCount ?? 0),
        0,
      );
      const activeDays = avg(memberStats.map((s) => s?.activeDays ?? 0));
      const resolutions = memberStats
        .filter((s) => s?.avgResolutionDays != null)
        .map((s) => s?.avgResolutionDays as number);

      return {
        teamId,
        teamName,
        memberCount: members.length,
        completedCount,
        activeDays,
        avgResolutionDays: resolutions.length > 0 ? avg(resolutions) : null,
      };
    })
    .sort((a, b) => b.completedCount - a.completedCount);

  return { success: true, data: { teams } };
}
