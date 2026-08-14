// components/projects/projects-list.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "./project-card";
import { CreateProjectModal } from "./modals/create-project-modal";
import { RecentlyViewedStrip } from "./recently-viewed-strip";
import type { Project } from "@/lib/db/schema";
import { useProjectStore } from "@/stores/project-store";

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
  initialProjects: Project[];
  currentUserId: string;
  initialMembersMap: Record<string, Member[]>;
  initialOwnerMap: Record<string, OwnerInfo>;
};

export function ProjectsList({
  initialProjects,
  currentUserId,
  initialMembersMap,
  initialOwnerMap,
}: ProjectsListProps) {
  const router = useRouter();

  const projects = useProjectStore((s) => s.projects);
  const setInitialProjects = useProjectStore((s) => s.setInitialProjects);
  const addProject = useProjectStore((s) => s.addProject);
  const setInitialMembersMap = useProjectStore((s) => s.setInitialMembersMap);

  useEffect(() => {
    setInitialProjects(initialProjects);
    setInitialMembersMap(initialMembersMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and organize your team projects
          </p>
        </div>
        <CreateProjectModal onCreated={(project) => addProject(project)} />
      </div>

      <RecentlyViewedStrip
        projects={projects}
        initialMembersMap={initialMembersMap}
        initialOwnerMap={initialOwnerMap}
        currentUserId={currentUserId}
      />

      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium text-foreground">No projects yet.</p>
          <p className="text-xs mt-1">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Your Projects
            </h2>
            {ownedProjects.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card/50">
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
              <h2 className="text-base font-semibold text-foreground tracking-tight">
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
