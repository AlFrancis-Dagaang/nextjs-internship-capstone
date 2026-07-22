import {
  ArrowLeft,
  Settings,
  Users,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getProject } from "@/lib/actions/projects";
import { getListsByProject } from "@/lib/actions/lists";
import { getTasksByList } from "@/lib/actions/tasks";
import { Board, type ListWithTasks } from "@/components/lists/board";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projectResult = await getProject(id);

  if (!projectResult.success) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/projects"
              className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
                {project.name}
              </h1>
              <p className="text-paynes_gray-500 dark:text-french_gray-500 mt-1">
                {project.description ??
                  "Kanban board view for project management"}
              </p>
            </div>
          </div>

          {/* Unchanged from placeholder — non-functional, out of scope for #18 */}
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 rounded-lg transition-colors">
              <Users size={20} />
            </button>
            <button className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 rounded-lg transition-colors">
              <Calendar size={20} />
            </button>
            <button className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <button className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 rounded-lg transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        <Board projectId={id} initialLists={listsWithTasks} />
      </div>
    </DashboardLayout>
  );
}
