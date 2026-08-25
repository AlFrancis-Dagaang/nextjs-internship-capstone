"use client";

import { ActiveProjectsCard } from "./active-projects-card";
import { AssignedTasksCard } from "./assigned-tasks-card";
import { DashboardBanners } from "./dashboard-banners";
import { DashboardHeader } from "./dashboard-header";
import { UpcomingDeadlinesCard } from "./upcoming-deadlines-card";

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

export function DashboardView({
  userName,
  upcoming,
  activeProjects,
  assignedTasks,
}: DashboardViewProps) {
  return (
    <div className="w-full space-y-6 pb-12 px-2 sm:px-0">
      {/* Welcome & Quick Stats Header Banner using PageHeader */}
      <DashboardHeader
        userName={userName}
        projectCount={activeProjects.length}
        taskCount={assignedTasks.length}
        upcomingCount={upcoming.length}
      />

      {/* 3-Column Equal Height Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <UpcomingDeadlinesCard upcoming={upcoming} />
        <ActiveProjectsCard activeProjects={activeProjects} />
        <AssignedTasksCard assignedTasks={assignedTasks} />
      </div>

      {/* Bottom Stacked Banners */}
      <DashboardBanners taskCount={assignedTasks.length} />
    </div>
  );
}
