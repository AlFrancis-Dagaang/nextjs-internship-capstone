// components/projects/projects-list.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "./project-card";
import { CreateProjectModal } from "./modals/create-project-modal";
import { RecentlyViewedStrip } from "./recently-viewed-strip";
import type { Project } from "@/lib/db/schema";
import { useProjectStore } from "@/stores/project-store";
import type { ProjectMemberRole } from "@/types";

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
};

type OwnerInfo = {
  name?: string;
  email?: string;
};

type CompletionInfo = {
  total: number;
  completed: number;
};

type ProjectsListProps = {
  initialProjects: Project[];
  currentUserId: string;
  initialMembersMap: Record<string, Member[]>;
  initialOwnerMap: Record<string, OwnerInfo>;
  initialCompletionMap: Record<string, CompletionInfo>;
  initialMyRoleMap: Record<string, ProjectMemberRole>;
};

export function ProjectsList({
  initialProjects,
  currentUserId,
  initialMembersMap,
  initialOwnerMap,
  initialCompletionMap,
  initialMyRoleMap,
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

  return (
    <div className="space-y-10">
      {/* Header Container */}
      <div className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
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
        <div className="text-center py-16 text-muted-foreground bg-card border border-border/80 rounded-3xl shadow-xs">
          <p className="font-semibold text-foreground text-sm">
            No projects yet.
          </p>
          <p className="text-xs mt-1">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Projects
            </h2>
            {ownedProjects.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl bg-card/50">
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
                    completion={
                      initialCompletionMap[project.id] ?? {
                        total: 0,
                        completed: 0,
                      }
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {sharedProjects.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                    myRole={initialMyRoleMap[project.id]}
                    completion={
                      initialCompletionMap[project.id] ?? {
                        total: 0,
                        completed: 0,
                      }
                    }
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
