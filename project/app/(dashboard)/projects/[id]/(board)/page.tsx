// app/(dashboard)/projects/[id]/(board)/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Board, type ListWithTasks } from "@/components/lists/board";
import { ProjectHeader } from "@/components/projects/project-header";
import { getListsByProject } from "@/lib/actions/lists";
import { getEffectiveProjectMembers } from "@/lib/actions/project-member";
import { getProject } from "@/lib/actions/projects";
import { getTasksByProject } from "@/lib/actions/tasks";
import { queries } from "@/lib/db";
import type { Task } from "@/lib/db/schema";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertProjectAccess } from "@/lib/services/ownership";
import { toMemberList } from "@/lib/utils/utils";
import type { CalendarTaskDTO } from "@/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Strict format check
  if (!UUID_REGEX.test(id)) {
    notFound();
  }

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

  // 💡 2. Wrap database calls in try/catch to catch Postgres syntax/type rejections
  // on malformed UUIDs and turn them into a clean 404 instead of a server crash.
  let project = null;
  try {
    const projectResult = await getProject(id);
    if (projectResult.success && projectResult.data) {
      project = projectResult.data;
    }
  } catch {
    notFound();
  }

  if (!project) {
    notFound();
  }

  // 3. Fetch remaining data safely
  let listsResult, tasksResult, membersResult, accessResult, assigneeRows;
  try {
    [listsResult, tasksResult, membersResult, accessResult, assigneeRows] =
      await Promise.all([
        getListsByProject(id),
        getTasksByProject(id),
        getEffectiveProjectMembers(id),
        assertProjectAccess(id, authResult.user.id),
        queries.taskAssignees.getByProject(id),
      ]);
  } catch {
    notFound();
  }

  // Handle access failure if forbidden
  if ("error" in accessResult) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-red-600 dark:text-red-400">
          You don't have access to this project.
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

  const lists = listsResult.success ? listsResult.data : [];
  const allTasks = tasksResult.success ? tasksResult.data : [];
  const members = membersResult.success ? toMemberList(membersResult.data) : [];
  const owner = await queries.users.getById(project.ownerId);
  const role = accessResult.role;
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
