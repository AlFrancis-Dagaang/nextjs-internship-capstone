// app/projects/[id]/page.tsx
import Link from "next/link";
import { getProject } from "@/lib/actions/projects";
import { getListsByProject } from "@/lib/actions/lists";
import { getTasksByProject } from "@/lib/actions/tasks";
import { getProjectMembers } from "@/lib/actions/project-member";
import { queries } from "@/lib/db";
import { toMemberList } from "@/lib/utils/utils";
import { Board, type ListWithTasks } from "@/components/lists/board";
import { ProjectHeader } from "@/components/projects/project-header";
import type { Task } from "@/lib/db/schema";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertProjectAccess } from "@/lib/services/ownership";
import { toLocalDateKey } from "@/lib/utils/utils";
import { CalendarTaskDTO } from "@/types";
import { getEffectiveProjectMembers } from "@/lib/actions/project-member";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const [
    projectResult,
    listsResult,
    tasksResult,
    membersResult,
    accessResult,
    assigneeRows,
  ] = await Promise.all([
    getProject(id),
    getListsByProject(id),
    getTasksByProject(id),
    getEffectiveProjectMembers(id),
    assertProjectAccess(id, authResult.user.id),
    queries.taskAssignees.getByProject(id),
  ]);

  if (!projectResult.success) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-red-600 dark:text-red-400">
          {projectResult.error === "Forbidden"
            ? "You don't have access to this project."
            : "Project not found."}
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

  const project = projectResult.data;
  const lists = listsResult.success ? listsResult.data : [];
  const allTasks = tasksResult.success ? tasksResult.data : [];
  const members = membersResult.success ? toMemberList(membersResult.data) : [];
  const owner = await queries.users.getById(project.ownerId);
  const role = "error" in accessResult ? "viewer" : accessResult.role;
  const canManage = role === "owner" || role === "admin";
  const tasksByList = new Map<string, Task[]>();
  for (const task of allTasks) {
    const arr = tasksByList.get(task.listId) ?? [];
    arr.push(task);
    tasksByList.set(task.listId, arr);
  }

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
      name: row.userName,
      email: row.userEmail,
      imageUrl: row.userImageUrl,
      hasImage: row.userHasImage,
    });
    assigneesByTask.set(row.taskId, arr);
  }

  const listsWithTasks: ListWithTasks[] = lists.map((list) => ({
    ...list,
    tasks: (tasksByList.get(list.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((task) => ({
        ...task,
        assignees: assigneesByTask.get(task.id) ?? [],
      })),
  }));

  const upcomingTasks: CalendarTaskDTO[] = allTasks
    .filter((t): t is Task & { dueDate: Date } => t.dueDate !== null)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate.toISOString(),
      priority: t.priority,
      projectId: project.id,
      projectName: project.name,
      isCompleted: t.isCompleted,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-4">
      <div className="shrink-0">
        <ProjectHeader
          project={project}
          initialMembers={members}
          isOwner={role === "owner"}
          canManage={canManage}
          ownerName={owner?.name}
          ownerEmail={owner?.email}
          ownerImageUrl={owner?.imageUrl}
          ownerHasImage={owner?.hasImage}
          role={role}
          currentUserId={authResult.user.id}
          upcomingTasks={upcomingTasks}
          dueDate={project.dueDate ?? null}
        />
      </div>

      {/* Board container takes remaining height with strict overflow bounds */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Board
          projectId={id}
          initialLists={listsWithTasks}
          role={role}
          currentUserId={authResult.user.id}
        />
      </div>
    </div>
  );
}
