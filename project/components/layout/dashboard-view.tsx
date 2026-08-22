// components/dashboard/dashboard-view.tsx
"use client";

import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  FolderGit2,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

type UpcomingItemDTO = {
  id: string;
  type: "task" | "event";
  title: string;
  date: string;
  projectId: string | null;
  projectName: string | null;
  priority?: string | null;
};

type ActiveProjectDTO = {
  id: string;
  name: string;
  completed: number;
  total: number;
  completionLabel: string;
  completionPercent: number;
  dueDate: string | null;
};

type AssignedTaskDTO = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string | null;
  projectId: string;
  projectName: string;
  listId: string;
};

type DashboardViewProps = {
  userName: string;
  upcoming: UpcomingItemDTO[];
  activeProjects: ActiveProjectDTO[];
  assignedTasks: AssignedTaskDTO[];
};

function formatRelativeDate(isoString: string): string {
  try {
    const target = new Date(isoString);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`;
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

    return target.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

function getPriorityBadgeClass(priority: string | null | undefined): string {
  if (!priority)
    return "bg-secondary text-secondary-foreground border-border/80";
  const normalized = priority.toLowerCase();
  return (
    priorityColors[normalized] ||
    "bg-secondary text-secondary-foreground border-border/80"
  );
}

export function DashboardView({
  userName,
  upcoming,
  activeProjects,
  assignedTasks,
}: DashboardViewProps) {
  const maxAssignedTasks = 4;
  const displayedAssignedTasks = assignedTasks.slice(0, maxAssignedTasks);
  const remainingAssignedCount = assignedTasks.length - maxAssignedTasks;

  const maxActiveProjects = 4;
  const displayedProjects = activeProjects.slice(0, maxActiveProjects);
  const remainingProjectsCount = activeProjects.length - maxActiveProjects;

  const maxUpcoming = 4;
  const displayedUpcoming = upcoming.slice(0, maxUpcoming);
  const remainingUpcomingCount = upcoming.length - maxUpcoming;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Welcome & Quick Stats Header Banner */}
      <div className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-muted-foreground">
            Here is an overview of your schedule, active projects, and assigned
            tasks.
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs">
            <FolderGit2 size={13} className="text-primary" />
            <span className="font-semibold text-foreground">
              {activeProjects.length}
            </span>
            <span className="text-muted-foreground">Projects</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs">
            <CheckSquare size={13} className="text-primary" />
            <span className="font-semibold text-foreground">
              {assignedTasks.length}
            </span>
            <span className="text-muted-foreground">Assigned Tasks</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs">
            <Clock size={13} className="text-primary" />
            <span className="font-semibold text-foreground">
              {upcoming.length}
            </span>
            <span className="text-muted-foreground">Upcoming</span>
          </div>
        </div>
      </div>

      {/* 3-Column Equal Height Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* 1. Upcoming Deadlines Card */}
        <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Upcoming Deadlines
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                {upcoming.length}
              </span>
            </div>

            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-xs font-semibold text-foreground">
                  Nothing due soon
                </p>
                <p className="text-[11px] mt-0.5">
                  You are all caught up on upcoming deadlines.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedUpcoming.map((item) => {
                  const relativeDate = formatRelativeDate(item.date);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-secondary/30 border border-border/60 hover:bg-secondary/60 transition-colors gap-3"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                              item.type === "task"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>

                        {item.projectName && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.projectId ? (
                              <Link
                                href={`/projects/${item.projectId}`}
                                className="hover:underline text-primary font-medium"
                              >
                                {item.projectName}
                              </Link>
                            ) : (
                              item.projectName
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-foreground block">
                          {relativeDate}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {remainingUpcomingCount > 0 && (
                  <div className="text-center pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      +{remainingUpcomingCount} more upcoming item
                      {remainingUpcomingCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View Calendar</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* 2. Active Projects Card */}
        <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FolderGit2 size={15} className="text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Active Projects
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                {activeProjects.length}
              </span>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  No active projects
                </p>
                <div>
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-xl shadow-2xs hover:bg-primary/90"
                  >
                    Create your first project
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedProjects.map((project) => {
                  const hasValidTotal = project.total > 0;

                  return (
                    <div
                      key={project.id}
                      className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {project.name}
                        </Link>
                        <span className="text-xs font-bold text-foreground shrink-0">
                          {project.completionLabel}
                        </span>
                      </div>

                      {hasValidTotal && (
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${project.completionPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {remainingProjectsCount > 0 && (
                  <div className="text-center pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      +{remainingProjectsCount} more project
                      {remainingProjectsCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View all projects</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* 3. Assigned to Me Card */}
        <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full md:col-span-2 lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Assigned to Me
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                {assignedTasks.length}
              </span>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-xs font-semibold text-foreground">
                  Nothing assigned to you right now
                </p>
                <p className="text-[11px] mt-0.5">
                  Tasks assigned across your projects will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedAssignedTasks.map((task) => {
                  const priorityClass = getPriorityBadgeClass(task.priority);
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground line-clamp-1">
                          {task.title}
                        </span>
                        {task.priority && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${priorityClass}`}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40">
                        <Link
                          href={`/projects/${task.projectId}`}
                          className="text-muted-foreground hover:text-foreground font-medium truncate"
                        >
                          {task.projectName}
                        </Link>
                        {task.dueDate && (
                          <span className="text-muted-foreground shrink-0">
                            Due{" "}
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {remainingAssignedCount > 0 && (
                  <div className="text-center pt-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      +{remainingAssignedCount} more assigned task
                      {remainingAssignedCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View Analytics</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Stacked Rows (Each banner on its own separate full-width row) */}
      <div className="space-y-4">
        {/* Productivity Tip Banner */}
        <div className="p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/20">
              <TrendingUp size={18} />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                Productivity Tip
              </div>
              <div className="text-xs text-muted-foreground">
                You have {assignedTasks.length} active tasks assigned. Keeping
                your task statuses up to date helps your team track milestone
                velocity.
              </div>
            </div>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all shrink-0"
          >
            <span>Manage Projects</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Workspace Collaboration Banner */}
        <div className="p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-secondary text-foreground shrink-0 border border-border/60">
              <Users size={18} />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                Team Collaboration
              </div>
              <div className="text-xs text-muted-foreground">
                Collaborate with your team members across active workspaces,
                manage roles, and review shared performance metrics.
              </div>
            </div>
          </div>
          <Link
            href="/team"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all shrink-0"
          >
            <span>View Teams</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
