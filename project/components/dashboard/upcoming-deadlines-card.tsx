// components/dashboard/upcoming-deadlines-card.tsx
"use client";

import Link from "next/link";
import { Calendar, ArrowUpRight } from "lucide-react";

type UpcomingItemDTO = {
  id: string;
  type: "task" | "event";
  title: string;
  date: string;
  projectId: string | null;
  projectName: string | null;
  priority?: string | null;
};

function formatRelativeDate(isoString: string): string {
  try {
    const target = new Date(isoString);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`;
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

    return target.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function UpcomingDeadlinesCard({
  upcoming,
}: {
  upcoming: UpcomingItemDTO[];
}) {
  const maxUpcoming = 4;
  const displayedUpcoming = upcoming.slice(0, maxUpcoming);
  const remainingUpcomingCount = upcoming.length - maxUpcoming;

  return (
    <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Upcoming Deadlines
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
            {upcoming.length}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs font-semibold text-foreground">
              Nothing due soon
            </p>
            <p className="text-[11px] mt-0.5">
              You are all caught up on upcoming deadlines.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedUpcoming.map((item) => {
              const relativeDate = formatRelativeDate(item.date);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-secondary/30 border border-border/60 hover:bg-secondary/60 transition-colors gap-3 overflow-hidden"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                          item.type === "task"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    {item.projectName && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {item.projectId ? (
                          <Link
                            href={`/projects/${item.projectId}`}
                            className="hover:underline text-primary font-medium"
                          >
                            {item.projectName}
                          </Link>
                        ) : (
                          item.projectName
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-foreground block">
                      {relativeDate}
                    </span>
                  </div>
                </div>
              );
            })}

            {remainingUpcomingCount > 0 && (
              <div className="text-center pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  +{remainingUpcomingCount} more upcoming item
                  {remainingUpcomingCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>View Calendar</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
