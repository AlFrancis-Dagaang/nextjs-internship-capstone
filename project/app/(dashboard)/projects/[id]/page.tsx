import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProject } from "@/lib/actions/projects";
import { getListsByProject } from "@/lib/actions/lists";
import { getTasksByProject } from "@/lib/actions/tasks";
import { getProjectMembers } from "@/lib/actions/project-member";
import { queries } from "@/lib/db";
import { toMemberList } from "@/lib/utils";
import { Board, type ListWithTasks } from "@/components/lists/board";
import { ProjectHeader } from "@/components/projects/project-header";
import type { Task } from "@/lib/db/schema";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [projectResult, listsResult, tasksResult, membersResult] =
    await Promise.all([
      getProject(id),
      getListsByProject(id),
      getTasksByProject(id),
      getProjectMembers(id),
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

  const tasksByList = new Map<string, Task[]>();
  for (const task of allTasks) {
    const arr = tasksByList.get(task.listId) ?? [];
    arr.push(task);
    tasksByList.set(task.listId, arr);
  }

  const assigneeRows = await queries.taskAssignees.getByProject(id);
  const assigneesByTask = new Map<
    string,
    { userId: string; name?: string; email?: string }[]
  >();
  for (const row of assigneeRows) {
    const arr = assigneesByTask.get(row.taskId) ?? [];
    arr.push({ userId: row.userId, name: row.userName, email: row.userEmail });
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

  return (
    <div className="h-full flex flex-col overflow-hidden px-1 space-y-4">
      <div className="shrink-0">
        <ProjectHeader
          project={project}
          members={members}
          ownerName={owner?.name}
          ownerEmail={owner?.email}
        />
      </div>
      <div className="flex-1 min-h-0">
        <Board projectId={id} initialLists={listsWithTasks} />
      </div>
    </div>
  );
}
