"use client";

import { ArrowUpRight, FolderKanban } from "lucide-react";
import Link from "next/link";

type ActiveProjectDTO = {
  id: string;
  name: string;
  completed: number;
  total: number;
  completionLabel: string;
  completionPercent: number;
  dueDate: string | null;
};

export function ActiveProjectsCard({
  activeProjects,
}: {
  activeProjects: ActiveProjectDTO[];
}) {
  const maxActiveProjects = 4;
  const displayedProjects = activeProjects.slice(0, maxActiveProjects);
  const remainingProjectsCount = activeProjects.length - maxActiveProjects;

  return (
    <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <FolderKanban size={13} className="text-foreground shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Active Projects
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
            {activeProjects.length}
          </span>
        </div>

        {activeProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            <p className="text-xs font-semibold text-foreground">
              No active projects
            </p>
            <div>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-xl shadow-2xs hover:bg-primary/90"
              >
                Create your first project
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedProjects.map((project) => {
              const hasValidTotal = project.total > 0;

              return (
                <div
                  key={project.id}
                  className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-1.5 flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
                    >
                      {project.name}
                    </Link>
                    <span className="text-xs font-bold text-foreground shrink-0">
                      {project.completionLabel}
                    </span>
                  </div>

                  {hasValidTotal && (
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${project.completionPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {remainingProjectsCount > 0 && (
              <div className="text-center pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  +{remainingProjectsCount} more project
                  {remainingProjectsCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>View all projects</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
