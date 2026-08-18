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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card text-card-foreground border-l border-border p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-semibold text-foreground">
            {getTitle()}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground animate-pulse">
            Loading details...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}

        {!loading && !error && request && (
          <div className="space-y-6">
            {request.kind === "project" && projectData && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Open Tasks ({projectData.open.length})
                  </h4>
                  {projectData.open.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No open tasks.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {projectData.open.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-1"
                        >
                          <div className="text-sm font-medium text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.priority && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Completed Tasks ({projectData.completed.length})
                  </h4>
                  {projectData.completed.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No completed tasks.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {projectData.completed.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-1"
                        >
                          <div className="text-sm font-medium text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.priority && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
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
                  <p className="text-sm text-muted-foreground italic">
                    No activity recorded for this day.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {entry.actorName}
                          </span>
                          <span>
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {entry.action}:{" "}
                          <span className="font-normal">{entry.taskTitle}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground italic">
                    No completed tasks in this period.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {velocityData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-1"
                      >
                        <div className="text-sm font-medium text-foreground">
                          {entry.taskTitle}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Project: {entry.projectName}</span>
                          <span>Completed by {entry.actorName}</span>
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
                  <p className="text-sm text-muted-foreground italic">
                    No active users in this period.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeUsersData.members
                      .sort((a, b) => b.actionCount - a.actionCount)
                      .map((member) => (
                        <div
                          key={member.actorId}
                          className="p-3 rounded-lg border border-border bg-card shadow-xs flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {member.name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-foreground">
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
                  <p className="text-sm text-muted-foreground italic">
                    No task duration data available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {avgTaskTimeData.tasks
                      .sort((a, b) => b.durationDays - a.durationDays)
                      .map((task) => (
                        <div
                          key={task.taskId}
                          className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-1"
                        >
                          <div className="text-sm font-medium text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground italic">
                    No project efficiency data available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {teamEfficiencyData.map((proj) => (
                      <div
                        key={proj.projectId}
                        className="p-3 rounded-lg border border-border bg-card shadow-xs flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {proj.projectName}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
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
