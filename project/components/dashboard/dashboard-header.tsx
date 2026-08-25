// components/dashboard/dashboard-header.tsx
"use client"

import { CheckSquare, Clock, FolderKanban } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export function DashboardHeader({
  userName,
  projectCount,
  taskCount,
  upcomingCount,
}: {
  userName: string
  projectCount: number
  taskCount: number
  upcomingCount: number
}) {
  return (
    <PageHeader
      title={`Welcome back, ${userName}`}
      description="Here is an overview of your schedule, active projects, and assigned tasks."
    >
      {/* Stacked 3 rows on mobile, side-by-side row on sm/desktop */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <FolderKanban size={13} className="text-foreground shrink-0" />
            <span className="text-muted-foreground">Projects</span>
          </div>
          <span className="font-semibold text-foreground sm:ml-2">
            {projectCount}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <CheckSquare size={13} className="text-primary" />
            <span className="text-muted-foreground">Assigned Tasks</span>
          </div>
          <span className="font-semibold text-foreground sm:ml-2">
            {taskCount}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-primary" />
            <span className="text-muted-foreground">Upcoming</span>
          </div>
          <span className="font-semibold text-foreground sm:ml-2">
            {upcomingCount}
          </span>
        </div>
      </div>
    </PageHeader>
  )
}
