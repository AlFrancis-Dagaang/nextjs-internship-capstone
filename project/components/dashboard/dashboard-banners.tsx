"use client";

import { ArrowUpRight, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export function DashboardBanners({ taskCount }: { taskCount: number }) {
  return (
    <div className="space-y-4">
      {/* Productivity Tip Banner */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/20">
            <TrendingUp size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Productivity Tip
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              You have {taskCount} active tasks assigned. Keeping your task
              statuses up to date helps your team track milestone velocity.
            </div>
          </div>
        </div>
        <Link
          href="/projects"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all shrink-0"
        >
          <span>Manage Projects</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Workspace Collaboration Banner */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-secondary text-foreground shrink-0 border border-border/60">
            <Users size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Team Collaboration
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Collaborate with your team members across active workspaces,
              manage roles, and review shared performance metrics.
            </div>
          </div>
        </div>
        <Link
          href="/team"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all shrink-0"
        >
          <span>View Teams</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
