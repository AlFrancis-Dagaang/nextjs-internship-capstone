import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProject } from "@/lib/actions/projects";
import { getListsByProject } from "@/lib/actions/lists";
import { getTasksByList } from "@/lib/actions/tasks";
import { Board, type ListWithTasks } from "@/components/lists/board";
import { ProjectHeader } from "@/components/projects/project-header";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projectResult = await getProject(id);

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

  const listsResult = await getListsByProject(id);
  const lists = listsResult.success ? listsResult.data : [];

  const listsWithTasks: ListWithTasks[] = await Promise.all(
    lists.map(async (list) => {
      const tasksResult = await getTasksByList(list.id);
      return {
        ...list,
        tasks: tasksResult.success ? tasksResult.data : [],
      };
    }),
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 space-y-6">
      <ProjectHeader project={project} />
      <div className="pt-2">
        <Board projectId={id} initialLists={listsWithTasks} />
      </div>
    </div>
  );
}
