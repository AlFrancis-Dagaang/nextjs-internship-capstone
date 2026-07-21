import { DashboardLayout } from "@/components/dashboard-layout";
import { getProjects } from "@/lib/actions/projects";
import { ProjectsList } from "@/components/projects/projects-list";

export default async function ProjectsPage() {
  const result = await getProjects();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!result.success ? (
          <p className="text-red-600 dark:text-red-400">
            Error loading projects: {result.error}
          </p>
        ) : (
          <ProjectsList projects={result.data} />
        )}
      </div>
    </DashboardLayout>
  );
}
