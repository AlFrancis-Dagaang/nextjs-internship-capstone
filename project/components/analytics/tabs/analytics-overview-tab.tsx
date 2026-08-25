"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Clock,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { DrillDownRequest } from "@/components/analytics/drill-down-panel"

type MetricWithDelta = {
  value: number | null
  deltaPercent: number | null
}

type AnalyticsOverviewData = {
  velocity: MetricWithDelta
  teamEfficiency: MetricWithDelta & { label: string }
  activeUsers: MetricWithDelta
  avgTaskDays: MetricWithDelta
  projectProgress: {
    projectId: string
    projectName: string
    percent: number
  }[]
  teamActivity: { day: string; count: number }[]
}

export function AnalyticsOverviewTab({
  data,
  insightText,
  onOpenDrillDown,
  onViewFullReport,
  formatDate,
}: {
  data: AnalyticsOverviewData
  insightText: string
  onOpenDrillDown: (req: DrillDownRequest) => void
  onViewFullReport: () => void
  formatDate: (dateStr: string) => string
}) {
  const renderDelta = (deltaPercent: number | null) => {
    if (deltaPercent === null) return null
    const isPositive = deltaPercent >= 0
    return (
      <div
        className={`flex items-center gap-1 text-xs font-medium mt-1 ${
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">
          {isPositive ? `+${deltaPercent}%` : `${deltaPercent}%`} vs. last
          period
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Insight / Health Callout */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-secondary text-foreground shrink-0 border border-border/60">
            <Sparkles size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Performance Insight
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {insightText}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewFullReport}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all shrink-0 cursor-pointer"
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
          onClick={() => onOpenDrillDown({ kind: "velocity" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onOpenDrillDown({ kind: "velocity" })
          }}
          className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Project Velocity
            </span>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              <TrendingUp size={16} />
              <ChevronRight
                size={14}
                className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-bold tracking-tight text-foreground truncate">
                {data.velocity.value === null ? "No data" : data.velocity.value}
              </span>
              {data.velocity.value !== null && (
                <span className="text-[11px] text-muted-foreground shrink-0">
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
          onClick={() => onOpenDrillDown({ kind: "teamEfficiency" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onOpenDrillDown({ kind: "teamEfficiency" })
          }}
          className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Completion Rate
            </span>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              <BarChart3 size={16} />
              <ChevronRight
                size={14}
                className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-bold tracking-tight text-foreground truncate">
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
          onClick={() => onOpenDrillDown({ kind: "activeUsers" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onOpenDrillDown({ kind: "activeUsers" })
          }}
          className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Active Users
            </span>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              <Users size={16} />
              <ChevronRight
                size={14}
                className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-bold tracking-tight text-foreground truncate">
                {data.activeUsers.value === null
                  ? "No data"
                  : data.activeUsers.value}
              </span>
              {data.activeUsers.value !== null && (
                <span className="text-[11px] text-muted-foreground shrink-0">
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
          onClick={() => onOpenDrillDown({ kind: "avgTaskTime" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onOpenDrillDown({ kind: "avgTaskTime" })
          }}
          className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Avg. Task Time
            </span>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              <Clock size={16} />
              <ChevronRight
                size={14}
                className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-bold tracking-tight text-foreground truncate">
                {data.avgTaskDays.value === null
                  ? "No data"
                  : data.avgTaskDays.value}
              </span>
              {data.avgTaskDays.value !== null && (
                <span className="text-[11px] text-muted-foreground shrink-0">
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
        <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
              Project Progress
            </h3>
            <span className="text-[11px] text-muted-foreground font-semibold shrink-0">
              Completion %
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center pt-2">
            {data.projectProgress.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                No projects yet
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.projectProgress}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
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
                    tick={{ fontSize: 10 }}
                    width={80}
                    tickFormatter={(value) =>
                      value.length > 10 ? `${value.slice(0, 10)}...` : value
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
                        entry?.payload?.projectId || entry?.projectId
                      if (projId) {
                        onOpenDrillDown({ kind: "project", projectId: projId })
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
              Team Activity
            </h3>
            <span className="text-[11px] text-muted-foreground font-semibold shrink-0">
              Daily Actions
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.teamActivity.map((item) => ({
                  ...item,
                  formattedDay: formatDate(item.day),
                }))}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border/60"
                />
                <XAxis
                  dataKey="formattedDay"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
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
                    const dayVal = entry?.payload?.day || entry?.day
                    if (dayVal) {
                      onOpenDrillDown({ kind: "day", day: dayVal })
                    }
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
