// components/analytics/analytics-view.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Calendar as CalendarIcon,
  UserCheck,
  LayoutDashboard,
  Layers,
} from "lucide-react";
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
import { PageHeader } from "@/components/layout/page-header";
import {
  DrillDownPanel,
  DrillDownRequest,
} from "@/components/analytics/drill-down-panel";
import { getMemberBreakdown, getTeamBreakdown } from "@/lib/actions/analytics";
import { AnalyticsOverviewTab } from "./tabs/analytics-overview-tab";
import {
  AnalyticsMembersTab,
  MemberRow,
  TeamAverage,
} from "./tabs/analytics-members-tab";
import {
  AnalyticsTeamsTab,
  TeamBreakdownRow,
} from "./tabs/analytics-teams-tab";

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

  const [activeTab, setActiveTab] = useState<"overview" | "members" | "teams">(
    "overview",
  );

  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownRequest, setDrillDownRequest] =
    useState<DrillDownRequest | null>(null);

  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersList, setMembersList] = useState<MemberRow[]>([]);
  const [teamAverage, setTeamAverage] = useState<TeamAverage | null>(null);

  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamsList, setTeamsList] = useState<TeamBreakdownRow[]>([]);

  const [sortField, setSortField] = useState<SortField>("completedCount");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [teamSortField, setTeamSortField] =
    useState<TeamSortField>("completedCount");
  const [teamSortOrder, setTeamSortOrder] = useState<SortOrder>("desc");

  const handleOpenDrillDown = (req: DrillDownRequest) => {
    setDrillDownRequest(req);
    setDrillDownOpen(true);
  };

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
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === null) valA = -1;
      if (valB === null) valB = -1;

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [membersList, sortField, sortOrder]);

  const sortedTeams = useMemo(() => {
    return [...teamsList].sort((a, b) => {
      let valA: any = a[teamSortField];
      let valB: any = b[teamSortField];

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

    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");

    if (projectId) params.set("projectId", projectId);
    else params.delete("projectId");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return dateStr;
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
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
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  function getDynamicInsight(analyticsData: AnalyticsData): string {
    const vel = analyticsData.velocity.value ?? 0;
    const velDelta = analyticsData.velocity.deltaPercent;
    const users = analyticsData.activeUsers.value ?? 0;
    const avgDays = analyticsData.avgTaskDays.value;
    const efficiency = analyticsData.teamEfficiency.value ?? 0;

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
    <div className="w-full space-y-6 pb-12 px-2 sm:px-0">
      {/* Reusable Page Header with Filter Controls */}
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor your team's productivity, project progress, and activity over time."
      >
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="space-y-1 w-full">
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
                <div className="space-y-1 w-full">
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
            <SelectTrigger className="h-9 w-[150px] sm:w-[160px] px-3 rounded-xl border border-border/80 bg-background text-xs font-medium text-muted-foreground shadow-2xs hover:bg-secondary hover:text-foreground">
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
      </PageHeader>

      {/* Tab Toggle Navigation */}
      <div className="flex items-center space-x-1 sm:space-x-2 bg-secondary/70 p-1 rounded-2xl border border-border/60 w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
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
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
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
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
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
        <AnalyticsOverviewTab
          data={data}
          insightText={getDynamicInsight(data)}
          onOpenDrillDown={handleOpenDrillDown}
          onViewFullReport={handleViewFullReport}
          formatDate={formatDate}
        />
      )}

      {/* TEAM MEMBERS TAB CONTENT */}
      {activeTab === "members" && (
        <AnalyticsMembersTab
          loading={membersLoading}
          error={membersError}
          membersList={sortedMembers}
          teamAverage={teamAverage}
          sortField={sortField}
          onSort={handleSort}
        />
      )}

      {/* TEAMS TAB CONTENT */}
      {activeTab === "teams" && (
        <AnalyticsTeamsTab
          loading={teamsLoading}
          error={teamsError}
          teamsList={sortedTeams}
          teamSortField={teamSortField}
          onSort={handleTeamSort}
        />
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
