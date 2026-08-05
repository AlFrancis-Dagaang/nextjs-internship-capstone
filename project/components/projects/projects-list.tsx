"use client";

import { useRouter } from "next/navigation";
import { ProjectCard } from "./project-card";
import { CreateProjectModal } from "./modals/create-project-modal";
import { RecentlyViewedStrip } from "./recently-viewed-strip";
import type { Project } from "@/lib/db/schema";

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "editor" | "viewer";
};

type OwnerInfo = {
  name?: string;
  email?: string;
};

type ProjectsListProps = {
  projects: Project[];
  currentUserId: string;
  initialMembersMap: Record<string, Member[]>;
  initialOwnerMap: Record<string, OwnerInfo>;
};

export function ProjectsList({
  projects,
  currentUserId,
  initialMembersMap,
  initialOwnerMap,
}: ProjectsListProps) {
  const router = useRouter();

  const ownedProjects = projects.filter((p) => p.ownerId === currentUserId);
  const sharedProjects = projects.filter((p) => p.ownerId !== currentUserId);

  function getMyRole(projectId: string): "editor" | "viewer" | undefined {
    const members = initialMembersMap[projectId] ?? [];
    return members.find((m) => m.userId === currentUserId)?.role;
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            Projects
          </h1>
          <p className="text-paynes_gray-500 dark:text-french_gray-500 mt-2">
            Manage and organize your team projects
          </p>
        </div>
        <CreateProjectModal onCreated={() => router.refresh()} />
      </div>

      <RecentlyViewedStrip
        projects={projects}
        initialMembersMap={initialMembersMap}
        initialOwnerMap={initialOwnerMap}
        currentUserId={currentUserId}
      />

      {projects.length === 0 ? (
        <div className="text-center py-16 text-paynes_gray-500 dark:text-french_gray-400">
          <p>No projects yet.</p>
          <p className="text-sm mt-1">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
              Your Projects
            </h2>
            {ownedProjects.length === 0 ? (
              <div className="text-center py-10 text-sm text-paynes_gray-500 dark:text-french_gray-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                You haven&apos;t created a project yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentUserId={currentUserId}
                    initialMembers={initialMembersMap[project.id] ?? []}
                    ownerName={initialOwnerMap[project.id]?.name}
                    ownerEmail={initialOwnerMap[project.id]?.email}
                  />
                ))}
              </div>
            )}
          </section>

          {sharedProjects.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
                Shared With You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentUserId={currentUserId}
                    initialMembers={initialMembersMap[project.id] ?? []}
                    ownerName={initialOwnerMap[project.id]?.name}
                    ownerEmail={initialOwnerMap[project.id]?.email}
                    myRole={getMyRole(project.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
