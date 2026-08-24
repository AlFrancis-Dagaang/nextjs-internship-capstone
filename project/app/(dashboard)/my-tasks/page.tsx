import Link from "next/link";
import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { Board, type ListWithTasks } from "@/components/lists/board";
import { ProjectHeader } from "@/components/projects/project-header";
import type { CalendarTaskDTO } from "@/types";

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function MyTasksPage() {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-red-600 dark:text-red-400">
          {authResult.error ?? "Not authenticated."}
        </p>
        <Link
          href="/projects"
          className="text-blue_munsell-500 underline text-sm"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const userId = authResult.user.id;

  const assignedTaskRows =
    await queries.taskAssignees.getAssignedToUserAcrossProjects(userId);

  const taskIds: string[] = Array.from(
    new Set(assignedTaskRows.map((t: { id: string }) => t.id)),
  );
  const assigneeRows =
    taskIds.length > 0 ? await queries.taskAssignees.getByTaskIds(taskIds) : [];

  const assigneesByTask = new Map<
    string,
    {
      userId: string;
      name?: string;
      email?: string;
      imageUrl?: string | null;
      hasImage?: boolean | null;
    }[]
  >();

  for (const row of assigneeRows) {
    const arr = assigneesByTask.get(row.taskId) ?? [];
    arr.push({
      userId: row.userId,
      name: row.userName ?? undefined,
      email: row.userEmail ?? undefined,
      imageUrl: row.userImageUrl,
      hasImage: row.userHasImage,
    });
    assigneesByTask.set(row.taskId, arr);
  }

  const tasksWithMeta = assignedTaskRows.map((task: any) => ({
    ...task,
    commentCount: 0,
    assignees: assigneesByTask.get(task.id) ?? [],
  }));

  const todayKey = toLocalDateKey(new Date());

  const now = new Date();
  const dayOfWeek = now.getDay();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (6 - dayOfWeek));
  const endOfWeekKey = toLocalDateKey(endOfWeek);

  const overdueTasks: typeof tasksWithMeta = [];
  const dueTodayTasks: typeof tasksWithMeta = [];
  const dueThisWeekTasks: typeof tasksWithMeta = [];
  const dueLaterTasks: typeof tasksWithMeta = [];
  const noDueDateTasks: typeof tasksWithMeta = [];
  const completedTasks: typeof tasksWithMeta = [];

  for (const task of tasksWithMeta) {
    if (task.isCompleted) {
      completedTasks.push(task);
      continue;
    }

    if (!task.dueDate) {
      noDueDateTasks.push(task);
      continue;
    }

    const taskDateKey = toLocalDateKey(new Date(task.dueDate));

    if (taskDateKey < todayKey) {
      overdueTasks.push(task);
    } else if (taskDateKey === todayKey) {
      dueTodayTasks.push(task);
    } else if (taskDateKey <= endOfWeekKey) {
      dueThisWeekTasks.push(task);
    } else {
      dueLaterTasks.push(task);
    }
  }

  const lists: ListWithTasks[] = [
    {
      id: "overdue",
      projectId: "my-tasks",
      name: "Overdue",
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: overdueTasks,
    },
    {
      id: "due-today",
      projectId: "my-tasks",
      name: "Due Today",
      position: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: dueTodayTasks,
    },
    {
      id: "due-this-week",
      projectId: "my-tasks",
      name: "Due This Week",
      position: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: dueThisWeekTasks,
    },
    {
      id: "due-later",
      projectId: "my-tasks",
      name: "Due Later",
      position: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: dueLaterTasks,
    },
    {
      id: "no-due-date",
      projectId: "my-tasks",
      name: "No Due Date",
      position: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: noDueDateTasks,
    },
    {
      id: "completed",
      projectId: "my-tasks",
      name: "Completed",
      position: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: completedTasks,
    },
  ];

  const sortedLists = [...lists].sort(
    (a, b) => b.tasks.length - a.tasks.length,
  );

  const upcomingTasksForCalendar: CalendarTaskDTO[] = tasksWithMeta
    .filter((t: any): t is typeof t & { dueDate: Date } => t.dueDate !== null)
    .map((t: any) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate.toISOString(),
      priority: t.priority,
      projectId: t.projectId,
      projectName: t.projectName,
      isCompleted: t.isCompleted,
    }));

  const placeholderProject = {
    id: "my-tasks",
    name: "My Tasks",
    description: "Cross-project personal task board",
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
    dueDate: null,
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-4">
      <div className="shrink-0">
        <ProjectHeader
          project={placeholderProject}
          initialMembers={[]}
          isOwner={true}
          canManage={false}
          role="viewer"
          currentUserId={userId}
          upcomingTasks={upcomingTasksForCalendar}
          isMyTasksPage={true}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Board
          projectId="my-tasks"
          initialLists={sortedLists}
          role="viewer"
          currentUserId={userId}
        />
      </div>
    </div>
  );
}
