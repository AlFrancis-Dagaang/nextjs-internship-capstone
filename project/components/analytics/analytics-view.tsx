// components/analytics/analytics-view.tsx
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
  Layers,
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
import { getMemberBreakdown, getTeamBreakdown } from "@/lib/actions/analytics";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

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

type TeamBreakdownRow = {
  teamId: string;
  teamName: string;
  memberCount: number;
  completedCount: number;
  activeDays: number;
  avgResolutionDays: number | null;
};

type SortField = "completedCount" | "activeDays" | "avgResolutionDays";
type SortOrder = "asc" | "desc";

type TeamSortField =
  | "completedCount"
  | "activeDays"
  | "avgResolutionDays"
  | "memberCount";

export function AnalyticsView({ data }: AnalyticsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Tab state: "overview" | "members" | "teams"
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "teams">(
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

  // Teams breakdown data fetch state
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamsList, setTeamsList] = useState<TeamBreakdownRow[]>([]);

  // Sorting state for Team Members table
  const [sortField, setSortField] = useState<SortField>("completedCount");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Sorting state for Teams table
  const [teamSortField, setTeamSortField] =
    useState<TeamSortField>("completedCount");
  const [teamSortOrder, setTeamSortOrder] = useState<SortOrder>("desc");

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

  // Fetch team breakdown when filters change or tab switches to teams
  useEffect(() => {
    if (activeTab !== "teams") return;

    let isMounted = true;
    setTeamsLoading(true);
    setTeamsError(null);

    const startD = new Date(data.appliedFilters.startDate);
    const endD = new Date(data.appliedFilters.endDate);
    const projId = data.appliedFilters.projectId || undefined;

    async function fetchTeams() {
      try {
        const res = await getTeamBreakdown({
          startDate: startD,
          endDate: endD,
          projectId: projId,
        });
        if (!isMounted) return;
        if (res.success) {
          setTeamsList(res.data.teams);
        } else {
          setTeamsError(res.error);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTeamsError(err?.message || "Failed to load teams breakdown");
      } finally {
        if (isMounted) setTeamsLoading(false);
      }
    }

    fetchTeams();

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

  const handleTeamSort = (field: TeamSortField) => {
    if (teamSortField === field) {
      setTeamSortOrder(teamSortOrder === "asc" ? "desc" : "asc");
    } else {
      setTeamSortField(field);
      setTeamSortOrder("desc");
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

  const sortedTeams = useMemo(() => {
    return [...teamsList].sort((a, b) => {
      let valA = a[teamSortField];
      let valB = b[teamSortField];

      if (valA === null) valA = -1;
      if (valB === null) valB = -1;

      if (valA < valB) return teamSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return teamSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [teamsList, teamSortField, teamSortOrder]);

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
      return `High completion rate at ${efficiency}% across accessible projects with ${users} active contributors.`;
    }
    if (vel > 0) {
      return `Steady progress with ${vel} completed tasks and ${users} active members contributing this period.`;
    }
    return "No completed tasks recorded in this date range. Try expanding your filter window.";
  }

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
    <div className="w-full space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor your team&apos;s productivity, project progress, and
            activity over time.
          </p>
        </div>

        {/* Functional Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 rounded-xl border border-border/80 bg-background text-xs font-medium text-muted-foreground shadow-2xs hover:bg-secondary hover:text-foreground flex items-center gap-2"
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
              className="w-auto p-4 bg-card border border-border rounded-2xl shadow-xl space-y-3 z-50"
              align="end"
            >
              <div className="text-xs font-semibold text-foreground">
                Filter by Date Range
              </div>
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={data.appliedFilters.startDate}
                    onChange={(e) =>
                      updateFilters({ startDate: e.target.value })
                    }
                    style={{ filter: "none" }}
                    className="block w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none dark:invert"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={data.appliedFilters.endDate}
                    onChange={(e) => updateFilters({ endDate: e.target.value })}
                    style={{ filter: "none" }}
                    className="block w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none dark:invert"
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
            <SelectTrigger className="h-9 w-[160px] px-3 rounded-xl border border-border/80 bg-background text-xs font-medium text-muted-foreground shadow-2xs hover:bg-secondary hover:text-foreground">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground border border-border rounded-xl shadow-xl z-50">
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
      <div className="flex items-center space-x-2 bg-secondary/70 p-1 rounded-2xl border border-border/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "overview"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard size={14} />
          <span>Overview</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "members"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck size={14} />
          <span>Team Members</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("teams")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "teams"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers size={14} />
          <span>Teams</span>
        </button>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Weekly Insight / Health Callout */}
          <div className="p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-secondary text-foreground shrink-0 border border-border/60">
                <Sparkles size={18} />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-wider text-foreground">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all shrink-0 cursor-pointer"
            >
              <span>View full report</span>
              <ArrowUpRight size={13} />
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
              className="p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Project Velocity
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <TrendingUp size={16} />
                  <ChevronRight
                    size={14}
                    className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {data.velocity.value === null
                      ? "No data"
                      : data.velocity.value}
                  </span>
                  {data.velocity.value !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      tasks/week
                    </span>
                  )}
                </div>
                {renderDelta(data.velocity.deltaPercent)}
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                <span>View breakdown</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* Completion Rate */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDrillDown({ kind: "teamEfficiency" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleOpenDrillDown({ kind: "teamEfficiency" });
              }}
              className="p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Completion Rate
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <BarChart3 size={16} />
                  <ChevronRight
                    size={14}
                    className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {data.teamEfficiency.label}
                  </span>
                </div>
                {renderDelta(data.teamEfficiency.deltaPercent)}
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                <span>View breakdown</span>
                <ChevronRight size={12} />
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
              className="p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Users
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Users size={16} />
                  <ChevronRight
                    size={14}
                    className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {data.activeUsers.value === null
                      ? "No data"
                      : data.activeUsers.value}
                  </span>
                  {data.activeUsers.value !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      this week
                    </span>
                  )}
                </div>
                {renderDelta(data.activeUsers.deltaPercent)}
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                <span>View breakdown</span>
                <ChevronRight size={12} />
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
              className="p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Avg. Task Time
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Clock size={16} />
                  <ChevronRight
                    size={14}
                    className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {data.avgTaskDays.value === null
                      ? "No data"
                      : data.avgTaskDays.value}
                  </span>
                  {data.avgTaskDays.value !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      days
                    </span>
                  )}
                </div>
                {renderDelta(data.avgTaskDays.deltaPercent)}
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                <span>View breakdown</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Project Progress
                </h3>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Completion %
                </span>
              </div>
              <div className="h-72 w-full flex items-center justify-center pt-2">
                {data.projectProgress.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    No projects yet
                  </span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.projectProgress}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-border/60"
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
                          borderRadius: "16px",
                          fontSize: "12px",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="percent"
                        fill="var(--foreground)"
                        radius={[0, 6, 6, 0]}
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

            <div className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Team Activity
                </h3>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Daily Actions
                </span>
              </div>
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.teamActivity.map((item) => ({
                      ...item,
                      formattedDay: formatDate(item.day),
                    }))}
                    margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-border/60"
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
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
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
          className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/60">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Team Members Performance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Individual workload, task completion, and resolution times
                compared against team averages.
              </p>
            </div>
            {teamAverage && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground bg-secondary/50 px-3.5 py-2 rounded-xl border border-border/60">
                <span className="font-semibold text-foreground">Team Avg:</span>
                <span>{teamAverage.completedCount.toFixed(1)} tasks</span>
                <span>•</span>
                <span>{teamAverage.activeDays.toFixed(1)} days</span>
                <span>•</span>
                <span>
                  {teamAverage.avgResolutionDays !== null
                    ? `${teamAverage.avgResolutionDays.toFixed(1)} days`
                    : "—"}
                </span>
              </div>
            )}
          </div>

          {membersLoading && (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground animate-pulse">
              Loading team member metrics...
            </div>
          )}

          {membersError && (
            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
              {membersError}
            </div>
          )}

          {!membersLoading && !membersError && membersList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">
                No team activity in this period
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Try selecting a wider date range or clearing project filters.
              </p>
            </div>
          )}

          {!membersLoading && !membersError && membersList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                    <th className="py-3 px-4 rounded-l-xl">Member</th>
                    <th
                      onClick={() => handleSort("completedCount")}
                      className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Completed Tasks</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("activeDays")}
                      className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Active Days</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("avgResolutionDays")}
                      className="py-3 px-4 rounded-r-xl cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Avg. Resolution Time</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sortedMembers.map((member) => {
                    const stableKey = member.userId || member.email;
                    return (
                      <tr
                        key={member.userId}
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl border border-border flex items-center justify-center font-bold text-[10px] uppercase shrink-0 shadow-2xs ${getAvatarColor(
                                stableKey,
                              )}`}
                            >
                              {getInitials(member.name || member.email || "U")}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {member.completedCount}
                          </span>
                          {teamAverage && (
                            <span className="text-[11px] text-muted-foreground ml-1.5">
                              (avg: {teamAverage.completedCount.toFixed(1)})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {member.activeDays}
                          </span>
                          {teamAverage && (
                            <span className="text-[11px] text-muted-foreground ml-1.5">
                              (avg: {teamAverage.activeDays.toFixed(1)})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {member.avgResolutionDays !== null
                              ? `${member.avgResolutionDays.toFixed(1)} days`
                              : "—"}
                          </span>
                          {teamAverage && (
                            <span className="text-[11px] text-muted-foreground ml-1.5">
                              (avg:{" "}
                              {teamAverage.avgResolutionDays !== null
                                ? `${teamAverage.avgResolutionDays.toFixed(1)} days`
                                : "—"}
                              )
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TEAMS TAB CONTENT */}
      {activeTab === "teams" && (
        <div
          id="teams-section"
          className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/60">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Team Performance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregate workload and completion across each attached team.
              </p>
            </div>
          </div>

          {teamsLoading && (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground animate-pulse">
              Loading team performance metrics...
            </div>
          )}

          {teamsError && (
            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
              {teamsError}
            </div>
          )}

          {!teamsLoading && !teamsError && teamsList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">
                No teams attached to this project yet
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Try selecting a different project or check team attachments.
              </p>
            </div>
          )}

          {!teamsLoading && !teamsError && teamsList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                    <th className="py-3 px-4 rounded-l-xl">Team</th>
                    <th
                      onClick={() => handleTeamSort("memberCount")}
                      className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Members</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleTeamSort("completedCount")}
                      className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Completed Tasks</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleTeamSort("activeDays")}
                      className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Active Days</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleTeamSort("avgResolutionDays")}
                      className="py-3 px-4 rounded-r-xl cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Avg. Resolution Time</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sortedTeams.map((team) => {
                    return (
                      <tr
                        key={team.teamId}
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl border border-border bg-secondary/80 text-foreground flex items-center justify-center font-bold text-[10px] uppercase shrink-0 shadow-2xs">
                              {getInitials(team.teamName)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {team.teamName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {team.memberCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {team.completedCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {team.activeDays}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground">
                            {team.avgResolutionDays !== null
                              ? `${team.avgResolutionDays.toFixed(1)} days`
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
