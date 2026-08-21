// components/analytics/drill-down-panel.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getProjectDrillDown,
  getDayActivityDrillDown,
  getVelocityDrillDown,
  getActiveUsersDrillDown,
  getAvgTaskTimeDrillDown,
} from "@/lib/actions/analytics";
import { CheckCircle2, Clock, Calendar, ArrowRight } from "lucide-react";

export type DrillDownRequest =
  | { kind: "project"; projectId: string }
  | { kind: "day"; day: string }
  | { kind: "velocity" }
  | { kind: "activeUsers" }
  | { kind: "avgTaskTime" }
  | { kind: "teamEfficiency" };

interface DrillDownPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DrillDownRequest | null;
  startDate: string;
  endDate: string;
  projectId: string | null;
  teamEfficiencyData?: {
    projectId: string;
    projectName: string;
    percent: number;
  }[];
}

export function DrillDownPanel({
  open,
  onOpenChange,
  request,
  startDate,
  endDate,
  projectId,
  teamEfficiencyData = [],
}: DrillDownPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectData, setProjectData] = useState<{
    projectName: string;
    open: {
      id: string;
      title: string;
      priority: string | null;
      dueDate: string | null;
    }[];
    completed: {
      id: string;
      title: string;
      priority: string | null;
      dueDate: string | null;
    }[];
  } | null>(null);

  const [dayData, setDayData] = useState<{
    day: string;
    entries: {
      id: string;
      action: string;
      actorName: string;
      taskTitle: string;
      projectName: string;
      createdAt: string;
    }[];
  } | null>(null);

  const [velocityData, setVelocityData] = useState<{
    entries: {
      id: string;
      taskTitle: string;
      projectName: string;
      actorName: string;
      createdAt: string;
    }[];
  } | null>(null);

  const [activeUsersData, setActiveUsersData] = useState<{
    members: { actorId: string; name: string; actionCount: number }[];
  } | null>(null);

  const [avgTaskTimeData, setAvgTaskTimeData] = useState<{
    tasks: {
      taskId: string;
      title: string;
      projectName: string;
      durationDays: number;
    }[];
  } | null>(null);

  useEffect(() => {
    if (!open || !request) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const projIdParam = projectId || undefined;

    async function fetchData() {
      try {
        if (request?.kind === "project") {
          const res = await getProjectDrillDown(request.projectId);
          if (!isMounted) return;
          if (res.success) {
            setProjectData(res.data);
          } else {
            setError(res.error);
          }
        } else if (request?.kind === "day") {
          const res = await getDayActivityDrillDown({
            day: request.day,
            projectId: projIdParam,
          });
          if (!isMounted) return;
          if (res.success) {
            setDayData(res.data);
          } else {
            setError(res.error);
          }
        } else if (request?.kind === "velocity") {
          const res = await getVelocityDrillDown({
            startDate: startD,
            endDate: endD,
            projectId: projIdParam,
          });
          if (!isMounted) return;
          if (res.success) {
            setVelocityData(res.data);
          } else {
            setError(res.error);
          }
        } else if (request?.kind === "activeUsers") {
          const res = await getActiveUsersDrillDown({
            startDate: startD,
            endDate: endD,
            projectId: projIdParam,
          });
          if (!isMounted) return;
          if (res.success) {
            setActiveUsersData(res.data);
          } else {
            setError(res.error);
          }
        } else if (request?.kind === "avgTaskTime") {
          const res = await getAvgTaskTimeDrillDown({
            startDate: startD,
            endDate: endD,
            projectId: projIdParam,
          });
          if (!isMounted) return;
          if (res.success) {
            setAvgTaskTimeData(res.data);
          } else {
            setError(res.error);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load drill-down data");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [open, request, startDate, endDate, projectId]);

  const getTitle = () => {
    if (!request) return "Drill-Down Details";
    switch (request.kind) {
      case "project":
        return projectData
          ? `Project: ${projectData.projectName}`
          : "Project Details";
      case "day":
        return `Activity on ${request.day}`;
      case "velocity":
        return "Completed Tasks (Velocity)";
      case "activeUsers":
        return "Active Users Breakdown";
      case "avgTaskTime":
        return "Task Duration Breakdown";
      case "teamEfficiency":
        return "Team Efficiency by Project";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card text-card-foreground border-l border-border/80 rounded-l-3xl p-6 shadow-2xl">
        <SheetHeader className="mb-6 pb-3 border-b border-border/60">
          <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
            {getTitle()}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-16 text-xs text-muted-foreground animate-pulse">
            Loading details...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
            {error}
          </div>
        )}

        {!loading && !error && request && (
          <div className="space-y-6">
            {request.kind === "project" && projectData && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500" />
                    Open Tasks ({projectData.open.length})
                  </h4>
                  {projectData.open.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No open tasks.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {projectData.open.map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5"
                        >
                          <div className="text-xs font-semibold text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {task.priority && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                                {task.priority}
                              </span>
                            )}
                            {task.dueDate && <span>Due: {task.dueDate}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Completed Tasks ({projectData.completed.length})
                  </h4>
                  {projectData.completed.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No completed tasks.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {projectData.completed.map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5"
                        >
                          <div className="text-xs font-semibold text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {task.priority && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                                {task.priority}
                              </span>
                            )}
                            {task.dueDate && <span>Due: {task.dueDate}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {request.kind === "day" && dayData && (
              <div>
                {dayData.entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No activity recorded for this day.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dayData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {entry.actorName}
                          </span>
                          <span>
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          {entry.action}:{" "}
                          <span className="font-normal text-muted-foreground">
                            {entry.taskTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Project: {entry.projectName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {request.kind === "velocity" && velocityData && (
              <div>
                {velocityData.entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No completed tasks in this period.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {velocityData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5"
                      >
                        <div className="text-xs font-semibold text-foreground">
                          {entry.taskTitle}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Project: {entry.projectName}</span>
                          <span>By {entry.actorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {request.kind === "activeUsers" && activeUsersData && (
              <div>
                {activeUsersData.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No active users in this period.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeUsersData.members
                      .sort((a, b) => b.actionCount - a.actionCount)
                      .map((member) => (
                        <div
                          key={member.actorId}
                          className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs flex items-center justify-between"
                        >
                          <span className="text-xs font-semibold text-foreground">
                            {member.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/60">
                            {member.actionCount} actions
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {request.kind === "avgTaskTime" && avgTaskTimeData && (
              <div>
                {avgTaskTimeData.tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No task duration data available.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {avgTaskTimeData.tasks
                      .sort((a, b) => b.durationDays - a.durationDays)
                      .map((task) => (
                        <div
                          key={task.taskId}
                          className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5"
                        >
                          <div className="text-xs font-semibold text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Project: {task.projectName}</span>
                            <span className="font-semibold text-foreground">
                              {task.durationDays.toFixed(1)} days
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {request.kind === "teamEfficiency" && (
              <div>
                {teamEfficiencyData.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No project efficiency data available.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {teamEfficiencyData.map((proj) => (
                      <div
                        key={proj.projectId}
                        className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold text-foreground">
                          {proj.projectName}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {proj.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
