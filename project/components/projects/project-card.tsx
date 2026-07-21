import type { Project } from "@/lib/db/schema";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400 p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-sm text-paynes_gray-500 dark:text-french_gray-400 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      {project.dueDate && (
        <p className="text-xs text-paynes_gray-500 dark:text-french_gray-400">
          Due {new Date(project.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
