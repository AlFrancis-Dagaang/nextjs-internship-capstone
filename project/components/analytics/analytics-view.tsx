"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowUpDown,
  UserCheck,
  LayoutDashboard,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DrillDownPanel,
  DrillDownRequest,
} from "@/components/analytics/drill-down-panel";
import { getMemberBreakdown } from "@/lib/actions/analytics";

type MetricWithDelta = {
  value: number | null;
  deltaPercent: number | null;
};

type AnalyticsData = {
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
    startDate: string;
    endDate: string;
    projectId: string | null;
  };
};

interface AnalyticsViewProps {
  data: AnalyticsData;
}

type MemberRow = {
  userId: string;
  name: string;
  email: string;
  completedCount: number;
  activeDays: number;
  avgResolutionDays: number | null;
};

type TeamAverage = {
  completedCount: number;
  activeDays: number;
  avgResolutionDays: number | null;
};

type SortField = "completedCount" | "activeDays" | "avgResolutionDays";
type SortOrder = "asc" | "desc";

export function AnalyticsView({ data }: AnalyticsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Tab state: "overview" | "members"
  const [activeTab, setActiveTab] = useState<"overview" | "members">(
    "overview",
  );

  // Drill-down panel state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownRequest, setDrillDownRequest] =
    useState<DrillDownRequest | null>(null);

  // Team members data fetch state
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersList, setMembersList] = useState<MemberRow[]>([]);
  const [teamAverage, setTeamAverage] = useState<TeamAverage | null>(null);

  // Sorting state for Team Members table
  const [sortField, setSortField] = useState<SortField>("completedCount");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleOpenDrillDown = (req: DrillDownRequest) => {
    setDrillDownRequest(req);
    setDrillDownOpen(true);
  };

  // Fetch member breakdown when filters change or tab switches to members
  useEffect(() => {
    if (activeTab !== "members") return;

    let isMounted = true;
    setMembersLoading(true);
    setMembersError(null);

    const startD = new Date(data.appliedFilters.startDate);
    const endD = new Date(data.appliedFilters.endDate);
    const projId = data.appliedFilters.projectId || undefined;

    async function fetchMembers() {
      try {
        const res = await getMemberBreakdown({
          startDate: startD,
          endDate: endD,
          projectId: projId,
        });
        if (!isMounted) return;
        if (res.success) {
          setMembersList(res.data.members);
          setTeamAverage(res.data.teamAverage);
        } else {
          setMembersError(res.error);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setMembersError(
          err?.message || "Failed to load team members breakdown",
        );
      } finally {
        if (isMounted) setMembersLoading(false);
      }
    }

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [activeTab, data.appliedFilters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedMembers = useMemo(() => {
    return [...membersList].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null) valA = -1;
      if (valB === null) valB = -1;

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [membersList, sortField, sortOrder]);

  const updateFilters = (newFilters: {
    startDate?: string;
    endDate?: string;
    projectId?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const startDate =
      newFilters.startDate !== undefined
        ? newFilters.startDate
        : data.appliedFilters.startDate;
    const endDate =
      newFilters.endDate !== undefined
        ? newFilters.endDate
        : data.appliedFilters.endDate;
    const projectId =
      newFilters.projectId !== undefined
        ? newFilters.projectId
        : data.appliedFilters.projectId;

    if (startDate) {
      params.set("startDate", startDate);
    } else {
      params.delete("startDate");
    }

    if (endDate) {
      params.set("endDate", endDate);
    } else {
      params.delete("endDate");
    }

    if (projectId) {
      params.set("projectId", projectId);
    } else {
      params.delete("projectId");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return dateStr;
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return dateStr;
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderDelta = (deltaPercent: number | null) => {
    if (deltaPercent === null) return null;
    const isPositive = deltaPercent >= 0;
    return (
      <div
        className={`flex items-center gap-1 text-xs font-medium mt-1 ${
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5" />
        )}
        <span>
          {isPositive ? `+${deltaPercent}%` : `${deltaPercent}%`} vs. last
          period
        </span>
      </div>
    );
  };

  // Robust rule-based insight evaluating both deltas and absolute metrics
  function getDynamicInsight(data: AnalyticsData): string {
    const vel = data.velocity.value ?? 0;
    const velDelta = data.velocity.deltaPercent;
    const users = data.activeUsers.value ?? 0;
    const avgDays = data.avgTaskDays.value;
    const efficiency = data.teamEfficiency.value ?? 0;

    if (velDelta !== null && velDelta >= 10) {
      return `Great momentum! Team velocity is up +${velDelta}% this period with ${vel} tasks completed.`;
    }
    if (velDelta !== null && velDelta <= -10) {
      return `Velocity is down ${velDelta}% compared to the prior period. Check for blocking items.`;
    }
    if (avgDays !== null && avgDays > 5) {
      return `Tasks are taking an average of ${avgDays} days to complete. Consider breaking down larger tasks.`;
    }
    if (efficiency >= 80) {
      return `High completion efficiency at ${efficiency}% across active projects with ${users} active contributors.`;
    }
    if (vel > 0) {
      return `Steady progress with ${vel} completed tasks and ${users} active team members contributing this period.`;
    }
    return "No completed tasks recorded in this date range. Try expanding your filter window.";
  }

  // Functional action for viewing full report: switch to members tab & scroll into view
  const handleViewFullReport = () => {
    setActiveTab("members");
    setTimeout(() => {
      const element = document.getElementById("team-members-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your team&apos;s productivity, project progress, and
            activity over time.
          </p>
        </div>

        {/* Functional Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground shadow-xs hover:bg-muted/50 hover:text-foreground flex items-center gap-2"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>
                  {data.appliedFilters.startDate && data.appliedFilters.endDate
                    ? `${formatDisplayDate(data.appliedFilters.startDate)} – ${formatDisplayDate(data.appliedFilters.endDate)}`
                    : "Select date range"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-4 bg-card border border-border rounded-lg shadow-md space-y-3"
              align="end"
            >
              <div className="text-xs font-medium text-foreground">
                Filter by Date Range
              </div>
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={data.appliedFilters.startDate}
                    onChange={(e) =>
                      updateFilters({ startDate: e.target.value })
                    }
                    style={{ filter: "none" }}
                    className="block w-full px-2 py-1 text-xs rounded border border-border bg-card text-foreground focus:outline-none dark:invert"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={data.appliedFilters.endDate}
                    onChange={(e) => updateFilters({ endDate: e.target.value })}
                    style={{ filter: "none" }}
                    className="block w-full px-2 py-1 text-xs rounded border border-border bg-card text-foreground focus:outline-none dark:invert"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={data.appliedFilters.projectId || "all"}
            onValueChange={(val) =>
              updateFilters({
                projectId: val === "all" ? null : val,
              })
            }
          >
            <SelectTrigger className="h-8 w-[160px] px-3 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground shadow-xs hover:bg-muted/50 hover:text-foreground">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md">
              <SelectItem value="all" className="text-xs cursor-pointer">
                All Projects
              </SelectItem>
              {data.availableProjects.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  className="text-xs cursor-pointer"
                >
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab Toggle Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-lg w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "members"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Team Members</span>
        </button>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Weekly Insight / Health Callout with functional View Full Report button */}
          <div className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-md bg-muted text-foreground mt-0.5 sm:mt-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  Performance Insight
                </div>
                <div className="text-xs text-muted-foreground">
                  {getDynamicInsight(data)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleViewFullReport}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline shrink-0 cursor-pointer"
            >
              <span>View full report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Four metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Project Velocity */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDrillDown({ kind: "velocity" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleOpenDrillDown({ kind: "velocity" });
              }}
              className="bg-card text-card-foreground rounded-lg border border-border p-6 flex flex-col justify-between shadow-xs cursor-pointer group hover:border-foreground/50 hover:shadow-sm transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Project Velocity
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <TrendingUp className="w-5 h-5" />
                  <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-foreground">
                    {data.velocity.value === null
                      ? "No data yet"
                      : data.velocity.value}
                  </span>
                  {data.velocity.value !== null && (
                    <span className="text-xs text-muted-foreground">
                      tasks/week
                    </span>
                  )}
                </div>
                {renderDelta(data.velocity.deltaPercent)}
              </div>
              <div className="mt-3 pt-3 border-t border-border/55 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                <span>View breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Team Efficiency */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDrillDown({ kind: "teamEfficiency" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleOpenDrillDown({ kind: "teamEfficiency" });
              }}
              className="bg-card text-card-foreground rounded-lg border border-border p-6 flex flex-col justify-between shadow-xs cursor-pointer group hover:border-foreground/50 hover:shadow-sm transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Team Efficiency
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <BarChart3 className="w-5 h-5" />
                  <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-foreground">
                    {data.teamEfficiency.label}
                  </span>
                </div>
                {renderDelta(data.teamEfficiency.deltaPercent)}
              </div>
              <div className="mt-3 pt-3 border-t border-border/55 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                <span>View breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Active Users */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDrillDown({ kind: "activeUsers" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleOpenDrillDown({ kind: "activeUsers" });
              }}
              className="bg-card text-card-foreground rounded-lg border border-border p-6 flex flex-col justify-between shadow-xs cursor-pointer group hover:border-foreground/50 hover:shadow-sm transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Active Users
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Users className="w-5 h-5" />
                  <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-foreground">
                    {data.activeUsers.value === null
                      ? "No data yet"
                      : data.activeUsers.value}
                  </span>
                  {data.activeUsers.value !== null && (
                    <span className="text-xs text-muted-foreground">
                      this week
                    </span>
                  )}
                </div>
                {renderDelta(data.activeUsers.deltaPercent)}
              </div>
              <div className="mt-3 pt-3 border-t border-border/55 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                <span>View breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Avg. Task Time */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDrillDown({ kind: "avgTaskTime" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleOpenDrillDown({ kind: "avgTaskTime" });
              }}
              className="bg-card text-card-foreground rounded-lg border border-border p-6 flex flex-col justify-between shadow-xs cursor-pointer group hover:border-foreground/50 hover:shadow-sm transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Avg. Task Time
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Clock className="w-5 h-5" />
                  <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-foreground">
                    {data.avgTaskDays.value === null
                      ? "No data yet"
                      : data.avgTaskDays.value}
                  </span>
                  {data.avgTaskDays.value !== null && (
                    <span className="text-xs text-muted-foreground">days</span>
                  )}
                </div>
                {renderDelta(data.avgTaskDays.deltaPercent)}
              </div>
              <div className="mt-3 pt-3 border-t border-border/55 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                <span>View breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 flex flex-col shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">
                  Project Progress
                </h3>
                <span className="text-xs text-muted-foreground">
                  Completion %
                </span>
              </div>
              <div className="h-72 w-full flex items-center justify-center">
                {data.projectProgress.length === 0 ? (
                  <span className="text-sm text-muted-foreground italic">
                    No projects yet
                  </span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.projectProgress}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-border"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis
                        type="category"
                        dataKey="projectName"
                        tick={{ fontSize: 11 }}
                        width={90}
                        tickFormatter={(value) =>
                          value.length > 12 ? `${value.slice(0, 12)}...` : value
                        }
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          color: "var(--card-foreground)",
                          borderRadius: "var(--radius)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="percent"
                        fill="var(--foreground)"
                        radius={[0, 4, 4, 0]}
                        cursor="pointer"
                        onClick={(entry: any) => {
                          const projId =
                            entry?.payload?.projectId || entry?.projectId;
                          if (projId) {
                            handleOpenDrillDown({
                              kind: "project",
                              projectId: projId,
                            });
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 flex flex-col shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">
                  Team Activity
                </h3>
                <span className="text-xs text-muted-foreground">
                  Daily Actions
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.teamActivity.map((item) => ({
                      ...item,
                      formattedDay: formatDate(item.day),
                    }))}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-border"
                    />
                    <XAxis
                      dataKey="formattedDay"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-muted-foreground"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        color: "var(--card-foreground)",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--foreground)"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: "var(--foreground)",
                        cursor: "pointer",
                      }}
                      activeDot={{ r: 6, cursor: "pointer" }}
                      onClick={(entry: any) => {
                        const dayVal = entry?.payload?.day || entry?.day;
                        if (dayVal) {
                          handleOpenDrillDown({ kind: "day", day: dayVal });
                        }
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM MEMBERS TAB CONTENT */}
      {activeTab === "members" && (
        <div
          id="team-members-section"
          className="bg-card border border-border rounded-lg p-6 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Team Members Performance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Individual workload, task completion, and resolution times
                compared against team averages.
              </p>
            </div>
            {teamAverage && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border">
                <span>Team Avg:</span>
                <span className="font-medium text-foreground">
                  {teamAverage.completedCount.toFixed(1)} tasks
                </span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {teamAverage.activeDays.toFixed(1)} active days
                </span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {teamAverage.avgResolutionDays !== null
                    ? `${teamAverage.avgResolutionDays.toFixed(1)} days`
                    : "—"}
                </span>
              </div>
            )}
          </div>

          {membersLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground animate-pulse">
              Loading team member metrics...
            </div>
          )}

          {membersError && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {membersError}
            </div>
          )}

          {!membersLoading && !membersError && membersList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">
                No team activity in this period
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try selecting a wider date range or clearing project filters.
              </p>
            </div>
          )}

          {!membersLoading && !membersError && membersList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground bg-muted/30">
                    <th className="py-3 px-4 font-medium">Member</th>
                    <th
                      onClick={() => handleSort("completedCount")}
                      className="py-3 px-4 font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Completed Tasks</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("activeDays")}
                      className="py-3 px-4 font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Active Days</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("avgResolutionDays")}
                      className="py-3 px-4 font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Avg. Resolution Time</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedMembers.map((member) => (
                    <tr
                      key={member.userId}
                      className="hover:bg-muted/25 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">
                          {member.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">
                          {member.completedCount}
                        </span>
                        {teamAverage && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            (avg: {teamAverage.completedCount.toFixed(1)})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">
                          {member.activeDays}
                        </span>
                        {teamAverage && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            (avg: {teamAverage.activeDays.toFixed(1)})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">
                          {member.avgResolutionDays !== null
                            ? `${member.avgResolutionDays.toFixed(1)} days`
                            : "—"}
                        </span>
                        {teamAverage && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            (avg:{" "}
                            {teamAverage.avgResolutionDays !== null
                              ? `${teamAverage.avgResolutionDays.toFixed(1)} days`
                              : "—"}
                            )
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Drill-Down Slide-Over Panel */}
      <DrillDownPanel
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        request={drillDownRequest}
        startDate={data.appliedFilters.startDate}
        endDate={data.appliedFilters.endDate}
        projectId={data.appliedFilters.projectId}
        teamEfficiencyData={data.projectProgress}
      />
    </div>
  );
}
