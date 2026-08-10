// components/projects/recently-viewed-strip.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { getRecentlyViewedIds } from "@/hooks/use-track-project-view";

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

type RecentlyViewedStripProps = {
  projects: Project[];
  initialMembersMap: Record<string, Member[]>;
  initialOwnerMap: Record<string, OwnerInfo>;
  currentUserId: string;
};

export function RecentlyViewedStrip({
  projects,
  currentUserId,
}: RecentlyViewedStripProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Read localStorage only on the client, after mount — avoids SSR
  // mismatch since localStorage doesn't exist on the server.
  useEffect(() => {
    setRecentIds(getRecentlyViewedIds());
  }, []);

  const recentProjects = recentIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => p !== undefined)
    .slice(0, 6);

  if (recentProjects.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
        <Clock size={13} />
        Recently Viewed
      </h2>

      {/* Horizontal scroll container with custom scrollbar styling */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {recentProjects.map((project) => {
          const isOwner = project.ownerId === currentUserId;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group relative shrink-0 w-60 p-4 rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 backdrop-blur-xl hover:border-cyan-500/40 dark:hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/[0.03] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate tracking-tight">
                    {project.name}
                  </p>

                  <div className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 group-hover:bg-cyan-500 group-hover:text-neutral-950 flex items-center justify-center transition-all duration-200 shrink-0">
                    <ArrowUpRight size={11} />
                  </div>
                </div>

                {project.description ? (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-normal">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-600 italic line-clamp-1">
                    No description
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 dark:text-neutral-500 font-medium">
                  {isOwner ? "Owned by you" : "Shared"}
                </span>

                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60 capitalize">
                  {isOwner ? "Owner" : "Member"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
