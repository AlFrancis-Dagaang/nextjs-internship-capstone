"use client";

import { useRouter } from "next/navigation";
import { ProjectCard } from "./project-card";
import { CreateProjectModal } from "./modals/create-project-modal";
import type { Project } from "@/lib/db/schema";

type Member = {
  id: string;
  userId: string;
  email?: string;
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
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

      {projects.length === 0 ? (
        <div className="text-center py-16 text-paynes_gray-500 dark:text-french_gray-400">
          <p>No projects yet.</p>
          <p className="text-sm mt-1">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
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
    </div>
  );
}
