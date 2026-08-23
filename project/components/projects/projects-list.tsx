// components/projects/projects-list.tsx
"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import { ProjectCard } from "./project-card";
import { CreateProjectModal } from "./modals/create-project-modal";
import { RecentlyViewedStrip } from "./recently-viewed-strip";
import type { Project } from "@/lib/db/schema";
import { useProjectStore } from "@/stores/project-store";
import { PageHeader } from "@/components/layout/page-header";
import type {
  ProjectMember,
  OwnerInfo,
  CompletionInfo,
  ProjectMemberRole,
} from "@/types";

type ProjectsListProps = {
  initialProjects: Project[];
  currentUserId: string;
  initialMembersMap: Record<string, ProjectMember[]>;
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
    <div className="w-full space-y-6 sm:space-y-8 pb-12 px-2 sm:px-0">
      <PageHeader
        title="Projects"
        description="Manage and organize your team projects"
      >
        <CreateProjectModal onCreated={(project) => addProject(project)} />
      </PageHeader>

      <RecentlyViewedStrip projects={projects} currentUserId={currentUserId} />

      {projects.length === 0 ? (
        /* Global Empty State — Clickable to open Create Project Modal */
        <CreateProjectModal
          onCreated={(project) => addProject(project)}
          trigger={
            <div className="group w-full text-center py-12 sm:py-16 px-4 sm:px-6 bg-card border-2 border-dashed border-border/80 hover:border-primary/50 rounded-3xl shadow-xs space-y-3 cursor-pointer transition-all duration-200 hover:bg-secondary/30">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary/80 group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border/60 group-hover:border-primary/20">
                <Plus size={22} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  No projects yet
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Click anywhere here to create your first project and get
                  started.
                </p>
              </div>
            </div>
          }
        />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Your Projects Section */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Your Projects
            </h2>
            {ownedProjects.length === 0 ? (
              /* Owned Projects Empty State — Clickable to open Create Project Modal */
              <CreateProjectModal
                onCreated={(project) => addProject(project)}
                trigger={
                  <div className="group w-full flex items-center justify-center gap-3 py-8 sm:py-10 px-4 sm:px-6 text-xs text-muted-foreground border-2 border-dashed border-border/80 hover:border-primary/50 rounded-3xl bg-card/40 hover:bg-secondary/30 cursor-pointer transition-all duration-200 text-center">
                    <div className="p-2 rounded-xl bg-secondary group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                      <Plus size={16} />
                    </div>
                    <span className="font-medium group-hover:text-foreground transition-colors">
                      You haven&apos;t created a project yet. Click to create
                      one.
                    </span>
                  </div>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {ownedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentUserId={currentUserId}
                    initialMembers={initialMembersMap[project.id] ?? []}
                    ownerName={initialOwnerMap[project.id]?.name}
                    ownerEmail={initialOwnerMap[project.id]?.email}
                    ownerImageUrl={initialOwnerMap[project.id]?.imageUrl}
                    ownerHasImage={initialOwnerMap[project.id]?.hasImage}
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

          {/* Shared With You Section */}
          {sharedProjects.length > 0 && (
            <section className="space-y-3 sm:space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Shared With You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sharedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentUserId={currentUserId}
                    initialMembers={initialMembersMap[project.id] ?? []}
                    ownerName={initialOwnerMap[project.id]?.name}
                    ownerEmail={initialOwnerMap[project.id]?.email}
                    ownerImageUrl={initialOwnerMap[project.id]?.imageUrl}
                    ownerHasImage={initialOwnerMap[project.id]?.hasImage}
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
        </div>
      )}
    </div>
  );
}
