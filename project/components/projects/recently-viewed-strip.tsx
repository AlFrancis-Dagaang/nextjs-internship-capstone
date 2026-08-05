"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
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
      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
        <Clock size={13} />
        Recently Viewed
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recentProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="shrink-0 w-56 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
          >
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {project.name}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {project.ownerId === currentUserId
                ? "Owned by you"
                : "Shared with you"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
