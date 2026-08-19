// components/projects/recently-viewed-strip.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { getRecentlyViewedIds } from "@/hooks/use-track-project-view";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

  // Read localStorage only on the client, after mount — avoids SSR mismatch
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
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-0.5">
        <Clock size={13} />
        Recently Viewed
      </h2>

      {/* shadcn Carousel integration */}
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full relative group"
      >
        <CarouselContent className="-ml-3 py-1">
          {recentProjects.map((project) => {
            const isOwner = project.ownerId === currentUserId;

            return (
              <CarouselItem key={project.id} className="pl-3 basis-auto">
                <Link
                  href={`/projects/${project.id}`}
                  className="group/card relative shrink-0 w-60 p-4 rounded-xl border border-border bg-card backdrop-blur-xl hover:border-ring hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-3 shadow-sm block"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground group-hover/card:text-primary transition-colors truncate tracking-tight">
                        {project.name}
                      </p>

                      <div className="w-5 h-5 rounded-md bg-muted text-muted-foreground group-hover/card:bg-primary group-hover/card:text-primary-foreground flex items-center justify-center transition-all duration-200 shrink-0 shadow-sm">
                        <ArrowUpRight size={11} />
                      </div>
                    </div>

                    {project.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-1 leading-normal">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic line-clamp-1">
                        No description
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">
                      {isOwner ? "Owned by you" : "Shared"}
                    </span>

                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border capitalize">
                      {isOwner ? "Owner" : "Member"}
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Carousel navigation buttons visible on hover */}
        <CarouselPrevious className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border-border text-foreground hover:bg-muted shadow-md" />
        <CarouselNext className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border-border text-foreground hover:bg-muted shadow-md" />
      </Carousel>
    </section>
  );
}
