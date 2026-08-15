"use client";

import React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

type TeamOverviewProject = {
  id: string;
  name: string;
  memberCount: number;
  avatars: { id: string; name: string }[];
};

interface TeamOverviewGridProps {
  projects: TeamOverviewProject[];
}

export function TeamOverviewGrid({ projects }: TeamOverviewGridProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Team Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          View and manage teams across your projects.
        </p>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border bg-card">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">
            You're not part of any projects yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/team/${project.id}`}
              className="group flex flex-col justify-between p-5 rounded-lg bg-card border border-border hover:border-foreground/50 transition-all shadow-sm hover:shadow"
            >
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base mb-1">
                  {project.name}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground gap-1.5 mb-4">
                  <Users className="h-4 w-4" />
                  <span>
                    {project.memberCount}{" "}
                    {project.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex -space-x-2 overflow-hidden">
                  {project.avatars.slice(0, 4).map((avatar) => (
                    <div
                      key={avatar.id}
                      title={avatar.name}
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ring-2 ring-card ${getAvatarColor(
                        avatar.id,
                      )}`}
                    >
                      {getInitials(avatar.name)}
                    </div>
                  ))}
                  {project.avatars.length > 4 && (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium bg-secondary text-secondary-foreground ring-2 ring-card">
                      +{project.avatars.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  View team &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
