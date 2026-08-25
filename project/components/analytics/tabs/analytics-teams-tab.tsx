"use client"

import { ArrowUpDown, Layers } from "lucide-react"
import { getInitials } from "@/lib/utils/avatar"

export type TeamBreakdownRow = {
  teamId: string
  teamName: string
  memberCount: number
  completedCount: number
  activeDays: number
  avgResolutionDays: number | null
}

type TeamSortField =
  | "completedCount"
  | "activeDays"
  | "avgResolutionDays"
  | "memberCount"

export function AnalyticsTeamsTab({
  loading,
  error,
  teamsList,
  teamSortField,
  onSort,
}: {
  loading: boolean
  error: string | null
  teamsList: TeamBreakdownRow[]
  teamSortField: TeamSortField
  onSort: (field: TeamSortField) => void
}) {
  return (
    <div
      id="teams-section"
      className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs space-y-6 overflow-hidden"
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

      {loading && (
        <div className="flex items-center justify-center py-16 text-xs text-muted-foreground animate-pulse">
          Loading team performance metrics...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
          {error}
        </div>
      )}

      {!loading && !error && teamsList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Layers className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
          <p className="text-xs font-semibold text-foreground">
            No teams attached to this project yet
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Try selecting a different project or check team attachments.
          </p>
        </div>
      )}

      {!loading && !error && teamsList.length > 0 && (
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                <th className="py-3 px-4 rounded-l-xl">Team</th>
                <th
                  onClick={() => onSort("memberCount")}
                  className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Members</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => onSort("completedCount")}
                  className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Completed Tasks</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => onSort("activeDays")}
                  className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Active Days</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => onSort("avgResolutionDays")}
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
              {teamsList.map((team) => (
                <tr
                  key={team.teamId}
                  className="hover:bg-secondary/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <div className="w-8 h-8 rounded-xl border border-border bg-secondary/80 text-foreground flex items-center justify-center font-bold text-[10px] uppercase shrink-0 shadow-2xs">
                        {getInitials(team.teamName)}
                      </div>
                      <div className="font-semibold text-foreground truncate">
                        {team.teamName}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {team.memberCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {team.completedCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {team.activeDays}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {team.avgResolutionDays !== null
                        ? `${team.avgResolutionDays.toFixed(1)} days`
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
