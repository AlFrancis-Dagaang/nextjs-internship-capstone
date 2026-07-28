import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProject } from "@/lib/actions/projects";
import { getListsByProject } from "@/lib/actions/lists";
import { getTasksByProject } from "@/lib/actions/tasks";
import { Board, type ListWithTasks } from "@/components/lists/board";
import { ProjectHeader } from "@/components/projects/project-header";
import type { Task } from "@/lib/db/schema";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [projectResult, listsResult, tasksResult] = await Promise.all([
    getProject(id),
    getListsByProject(id),
    getTasksByProject(id),
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

  const tasksByList = new Map<string, Task[]>();
  for (const task of allTasks) {
    const arr = tasksByList.get(task.listId) ?? [];
    arr.push(task);
    tasksByList.set(task.listId, arr);
  }

  const listsWithTasks: ListWithTasks[] = lists.map((list) => ({
    ...list,
    tasks: (tasksByList.get(list.id) ?? []).sort(
      (a, b) => a.position - b.position,
    ),
  }));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 space-y-6">
      <ProjectHeader project={project} />
      <div className="pt-2">
        <Board projectId={id} initialLists={listsWithTasks} />
      </div>
    </div>
  );
}
