"use client"

import { ArrowUpDown, Users } from "lucide-react"
import { UserAvatar } from "@/components/ui/user-avatar"

export type MemberRow = {
  userId: string
  name: string
  email: string
  imageUrl?: string | null
  hasImage?: boolean | null
  completedCount: number
  activeDays: number
  avgResolutionDays: number | null
}

export type TeamAverage = {
  completedCount: number
  activeDays: number
  avgResolutionDays: number | null
}

type SortField = "completedCount" | "activeDays" | "avgResolutionDays"

export function AnalyticsMembersTab({
  loading,
  error,
  membersList,
  teamAverage,
  sortField: _sortField,
  onSort,
}: {
  loading: boolean
  error: string | null
  membersList: MemberRow[]
  teamAverage: TeamAverage | null
  sortField: SortField
  onSort: (field: SortField) => void
}) {
  return (
    <div
      id="team-members-section"
      className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs space-y-6 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Team Members Performance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Individual workload, task completion, and resolution times compared
            against team averages.
          </p>
        </div>
        {teamAverage && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-xl border border-border/60">
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

      {loading && (
        <div className="flex items-center justify-center py-16 text-xs text-muted-foreground animate-pulse">
          Loading team member metrics...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
          {error}
        </div>
      )}

      {!loading && !error && membersList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Users className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
          <p className="text-xs font-semibold text-foreground">
            No team activity in this period
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Try selecting a wider date range or clearing project filters.
          </p>
        </div>
      )}

      {!loading && !error && membersList.length > 0 && (
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                <th className="py-3 px-4 rounded-l-xl">Member</th>
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
              {membersList.map((member) => {
                const displayName = member.name || member.email || "U"
                const stableKey = member.userId || member.email
                return (
                  <tr
                    key={member.userId}
                    className="hover:bg-secondary/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <UserAvatar
                          userId={stableKey}
                          name={displayName}
                          imageUrl={member.imageUrl}
                          hasImage={member.hasImage ?? false}
                          className="w-8 h-8 rounded-xl"
                          title={displayName}
                        />
                        <div className="truncate">
                          <div className="font-semibold text-foreground truncate">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-foreground">
                        {member.completedCount}
                      </span>
                      {teamAverage && (
                        <span className="text-[11px] text-muted-foreground ml-1.5">
                          (avg: {teamAverage.completedCount.toFixed(1)})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-foreground">
                        {member.activeDays}
                      </span>
                      {teamAverage && (
                        <span className="text-[11px] text-muted-foreground ml-1.5">
                          (avg: {teamAverage.activeDays.toFixed(1)})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
