// components/projects/calendar-view.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp,
  Layers,
  Plus,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EventFormModal } from "../calendar/modals/event-form-modal";
import type { CalendarTaskDTO, CalendarEventDTO } from "@/types";

export type CalendarProjectDTO = {
  id: string;
  name: string;
  dueDate: string;
};

interface CalendarViewProps {
  tasksByDate?: Record<string, CalendarTaskDTO[]>;
  eventsByDate?: Record<string, CalendarEventDTO[]>;
  projectsByDate?: Record<string, CalendarProjectDTO[]>;
  currentUserId: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CalendarView({
  tasksByDate = {},
  eventsByDate = {},
  projectsByDate = {},
  currentUserId,
}: CalendarViewProps) {
  const router = useRouter();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    formatDateKey(today),
  );

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<
    CalendarEventDTO | undefined
  >(undefined);

  const todayKey = formatDateKey(today);
  const safeTasksByDate = tasksByDate || {};
  const safeEventsByDate = eventsByDate || {};
  const safeProjectsByDate = projectsByDate || {};

  // Month grid calculation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
    ).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      days.push({
        dateKey: formatDateKey(prevDate),
        dayNum,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const currDate = new Date(currentYear, currentMonth, i);
      days.push({
        dateKey: formatDateKey(currDate),
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      days.push({
        dateKey: formatDateKey(nextDate),
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Aggregate stats & upcoming queue (tasks + events + projects)
  const {
    upcomingMilestones,
    totalMonthTasks,
    totalMonthProjects,
    highPriorityCount,
  } = useMemo(() => {
    const futureOrTodayItems: {
      dateKey: string;
      sortTime: string;
      type: "task" | "event" | "project";
      title: string;
      subtext: string;
      priority?: string | null;
      projectId?: string | null;
      task?: CalendarTaskDTO;
      event?: CalendarEventDTO;
      project?: CalendarProjectDTO;
    }[] = [];

    let monthTotalTasks = 0;
    let monthTotalProjects = 0;
    let highCount = 0;

    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    // Process Tasks
    Object.entries(safeTasksByDate).forEach(([dateKey, tasks]) => {
      if (dateKey.startsWith(currentMonthPrefix)) {
        monthTotalTasks += tasks.length;
        tasks.forEach((t) => {
          if (t.priority === "high") highCount++;
        });
      }

      if (dateKey >= todayKey) {
        tasks.forEach((task) => {
          futureOrTodayItems.push({
            dateKey,
            sortTime: dateKey,
            type: "task",
            title: task.title,
            subtext: task.projectName || "Project Task",
            priority: task.priority,
            projectId: task.projectId,
            task,
          });
        });
      }
    });

    // Process Events
    Object.entries(safeEventsByDate).forEach(([dateKey, events]) => {
      if (dateKey >= todayKey) {
        events.forEach((event) => {
          futureOrTodayItems.push({
            dateKey,
            sortTime: event.startAt,
            type: "event",
            title: event.title,
            subtext: event.projectId ? "Project Event" : "Personal Event",
            projectId: event.projectId,
            event,
          });
        });
      }
    });

    // Process Projects
    Object.entries(safeProjectsByDate).forEach(([dateKey, projects]) => {
      if (dateKey.startsWith(currentMonthPrefix)) {
        monthTotalProjects += projects.length;
      }

      if (dateKey >= todayKey) {
        projects.forEach((project) => {
          futureOrTodayItems.push({
            dateKey,
            sortTime: dateKey,
            type: "project",
            title: project.name,
            subtext: "Project Deadline",
            projectId: project.id,
            project,
          });
        });
      }
    });

    const sortedUpcoming = futureOrTodayItems.sort((a, b) => {
      if (a.sortTime !== b.sortTime) {
        return a.sortTime.localeCompare(b.sortTime);
      }
      const priorityOrder: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1,
      };
      const pA = priorityOrder[a.priority || ""] || 0;
      const pB = priorityOrder[b.priority || ""] || 0;
      return pB - pA;
    });

    return {
      upcomingMilestones: sortedUpcoming,
      totalMonthTasks: monthTotalTasks,
      totalMonthProjects: monthTotalProjects,
      highPriorityCount: highCount,
    };
  }, [
    safeTasksByDate,
    safeEventsByDate,
    safeProjectsByDate,
    todayKey,
    currentYear,
    currentMonth,
  ]);

  function getPriorityBadge(priority?: CalendarTaskDTO["priority"]) {
    if (!priority) return null;
    let variant: "secondary" | "destructive" = "secondary";
    let customClasses =
      "bg-secondary text-secondary-foreground border-border/60";

    if (priority === "high") {
      variant = "destructive";
      customClasses =
        "bg-destructive/15 text-destructive border-destructive/30";
    } else if (priority === "medium") {
      customClasses =
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }

    return (
      <Badge
        variant={variant}
        className={`text-[10px] capitalize shrink-0 font-semibold px-2 py-0.5 rounded-full ${customClasses}`}
      >
        {priority}
      </Badge>
    );
  }

  function formatEventTimeRange(startAt: string, endAt: string): string {
    try {
      const start = new Date(startAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      const end = new Date(endAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${start} – ${end}`;
    } catch {
      return "All Day";
    }
  }

  function formatRelativeDays(targetDateKey: string): string {
    if (targetDateKey === todayKey) return "Today";
    const [tY, tM, tD] = targetDateKey.split("-").map(Number);
    const [todayY, todayM, todayD] = todayKey.split("-").map(Number);
    const diffDays = Math.ceil(
      (new Date(tY, tM - 1, tD).getTime() -
        new Date(todayY, todayM - 1, todayD).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`;
  }

  const selectedDayTasks = selectedDate
    ? safeTasksByDate[selectedDate] || []
    : [];
  const selectedDayEvents = selectedDate
    ? safeEventsByDate[selectedDate] || []
    : [];
  const selectedDayProjects = selectedDate
    ? safeProjectsByDate[selectedDate] || []
    : [];

  return (
    <div className="w-full space-y-6 pb-12 px-2 sm:px-0">
      {/* Reusable PageHeader implementation */}
      <PageHeader
        title="Schedule & Deadlines"
        description="Manage upcoming milestones, track priority items, and coordinate project workflows."
      >
        <button
          onClick={() => {
            setEditingEvent(undefined);
            setIsEventModalOpen(true);
          }}
          className="h-9 px-4 bg-teal-700 text-white hover:bg-teal-800 text-xs font-medium rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> New Event
        </button>
      </PageHeader>

      {/* Main Grid & Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Calendar Grid */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Month Navigation Bar */}
          <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center bg-secondary border border-border/60 rounded-xl p-1">
              <button
                onClick={() =>
                  currentMonth === 0
                    ? (setCurrentMonth(11), setCurrentYear((p) => p - 1))
                    : setCurrentMonth((p) => p - 1)
                }
                aria-label="Previous Month"
                className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  currentMonth === 11
                    ? (setCurrentMonth(0), setCurrentYear((p) => p + 1))
                    : setCurrentMonth((p) => p + 1)
                }
                aria-label="Next Month"
                className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container */}
          {/* Calendar Grid Container */}
          <div className="bg-card rounded-3xl border border-border/80 overflow-hidden shadow-xs flex flex-col h-auto sm:h-[740px]">
            <div className="grid grid-cols-7 border-b border-border/60 bg-secondary/50 text-center py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              {WEEK_DAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-[460px] sm:min-h-0">
              {calendarGrid.map(
                ({ dateKey, dayNum, isCurrentMonth }, index) => {
                  const dayTasks = safeTasksByDate[dateKey] || [];
                  const dayEvents = safeEventsByDate[dateKey] || [];
                  const dayProjects = safeProjectsByDate[dateKey] || [];
                  const hasHighPriority = dayTasks.some(
                    (t) => t.priority === "high",
                  );
                  const isSelected = selectedDate === dateKey;
                  const isToday = dateKey === todayKey;

                  const totalItemsCount =
                    dayTasks.length + dayEvents.length + dayProjects.length;

                  return (
                    <button
                      key={`${dateKey}-${index}`}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`p-1.5 sm:p-2.5 flex flex-col justify-between border-b border-r border-border/60 text-left transition-all relative group focus-visible:outline-none focus-visible:z-25 overflow-hidden cursor-pointer min-h-[64px] sm:min-h-0 ${
                        !isCurrentMonth ? "opacity-30 bg-muted/10" : ""
                      } ${isSelected ? "bg-secondary text-secondary-foreground ring-1 ring-inset ring-ring z-20 font-semibold" : "hover:bg-secondary/40"}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-semibold rounded-full ${isToday ? "bg-teal-700 text-white font-bold shadow-2xs" : "text-foreground"}`}
                        >
                          {dayNum}
                        </span>
                        {hasHighPriority && (
                          <span
                            className="flex h-2 w-2 rounded-full bg-destructive shadow-2xs shrink-0"
                            title="High priority items due"
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-1 mt-auto pt-1 w-full overflow-hidden">
                        {dayTasks.length > 0 && (
                          <div className="hidden sm:flex items-center justify-between px-1.5 py-0.5 rounded-lg text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 truncate">
                            <span className="truncate">
                              {dayTasks[0].title}
                            </span>
                            {dayTasks.length > 1 && (
                              <span className="shrink-0 ml-1 text-[9px] opacity-80 font-bold">
                                +{dayTasks.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                        {dayEvents.length > 0 && (
                          <div className="hidden sm:flex items-center justify-between px-1.5 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 truncate">
                            <span className="truncate">
                              {dayEvents[0].title}
                            </span>
                            {dayEvents.length > 1 && (
                              <span className="shrink-0 ml-1 text-[9px] opacity-80 font-bold">
                                +{dayEvents.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                        {dayProjects.length > 0 && (
                          <div className="hidden sm:flex items-center justify-between px-1.5 py-0.5 rounded-lg text-[10px] font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 truncate">
                            <span className="truncate">
                              {dayProjects[0].name}
                            </span>
                            {dayProjects.length > 1 && (
                              <span className="shrink-0 ml-1 text-[9px] opacity-80 font-bold">
                                +{dayProjects.length - 1}
                              </span>
                            )}
                          </div>
                        )}

                        {totalItemsCount > 0 && (
                          <span className="sm:hidden text-[9px] font-semibold text-muted-foreground px-0.5 truncate">
                            {totalItemsCount} item
                            {totalItemsCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Combined Metrics Card */}
          <div className="bg-card rounded-3xl border border-border/80 p-5 shadow-xs flex flex-col shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 pb-3 border-b border-border/60">
              <TrendingUp size={15} className="text-teal-600" /> Month Overview
            </h3>
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="flex flex-col p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Tasks
                </span>
                <span className="text-base font-bold text-foreground mt-0.5">
                  {totalMonthTasks}
                </span>
              </div>
              <div className="flex flex-col p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Projects
                </span>
                <span className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {totalMonthProjects}
                </span>
              </div>
              <div className="flex flex-col p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  High Prio
                </span>
                <span className="text-base font-bold text-destructive mt-0.5">
                  {highPriorityCount}
                </span>
              </div>
              <div className="flex flex-col p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Queue
                </span>
                <span className="text-base font-bold text-foreground mt-0.5">
                  {upcomingMilestones.length}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Day Panel */}
          <div className="bg-card rounded-3xl border border-border/80 p-5 shadow-xs flex flex-col h-[320px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 truncate pr-2">
                <Layers size={15} className="text-teal-600 shrink-0" />
                <span className="truncate">
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" },
                      )
                    : "Select a Date"}
                </span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <CalendarIcon className="w-7 h-7 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground italic">
                    Click any calendar tile to review tasks and events.
                  </p>
                </div>
              ) : selectedDayTasks.length === 0 &&
                selectedDayEvents.length === 0 &&
                selectedDayProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <CheckCircle2 className="w-7 h-7 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground italic">
                    No deliverables or events scheduled for this date.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {selectedDayTasks.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Tasks ({selectedDayTasks.length})
                      </span>
                      {selectedDayTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() =>
                            router.push(
                              `/projects/${task.projectId}?openTask=${task.id}`,
                            )
                          }
                          className="flex items-center justify-between p-3 rounded-2xl border border-border/80 hover:border-teal-500/50 bg-secondary/30 hover:bg-card cursor-pointer transition-all group shadow-2xs"
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                            <span className="text-xs font-semibold text-foreground group-hover:text-teal-600 transition-colors truncate">
                              {task.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {task.projectName}
                            </span>
                          </div>
                          {getPriorityBadge(task.priority)}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedDayEvents.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Events ({selectedDayEvents.length})
                      </span>
                      {selectedDayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setEditingEvent(event);
                            setIsEventModalOpen(true);
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-secondary/30 transition-all group hover:border-teal-500/50 hover:bg-card cursor-pointer shadow-2xs"
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                            <span className="text-xs font-semibold text-foreground group-hover:text-teal-600 transition-colors truncate">
                              {event.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                              <CalendarDays
                                size={12}
                                className="text-amber-500 shrink-0"
                              />
                              {formatEventTimeRange(event.startAt, event.endAt)}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${event.projectId ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-secondary-foreground"}`}
                          >
                            {event.projectId ? "Project" : "Personal"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedDayProjects.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Projects ({selectedDayProjects.length})
                      </span>
                      {selectedDayProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs"
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {project.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                              <CalendarIcon
                                size={12}
                                className="text-purple-500 shrink-0"
                              />
                              Due Deadline
                            </span>
                          </div>
                          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full shrink-0 bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            Deadline
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Milestones Queue Card */}
          <div className="bg-card rounded-3xl border border-border/80 p-5 shadow-xs flex flex-col h-[320px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Clock size={15} className="text-teal-600" /> Upcoming
                Milestones
              </h3>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {upcomingMilestones.length} items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {upcomingMilestones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <p className="text-xs text-muted-foreground italic">
                    No immediate upcoming deadlines.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {upcomingMilestones.map((item, idx) => {
                    const isToday = item.dateKey === todayKey;
                    return (
                      <div
                        key={`upcoming-${item.type}-${item.task?.id || item.event?.id || item.project?.id || idx}`}
                        onClick={() => {
                          if (item.type === "task" && item.task) {
                            router.push(
                              `/projects/${item.task.projectId}?openTask=${item.task.id}`,
                            );
                          } else if (item.type === "event" && item.event) {
                            setEditingEvent(item.event);
                            setIsEventModalOpen(true);
                          }
                        }}
                        className={`flex flex-col p-3 rounded-2xl border border-border/80 bg-secondary/30 transition-all gap-1.5 group shadow-2xs ${item.type === "project" ? "" : "hover:border-teal-500/50 hover:bg-card cursor-pointer"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground group-hover:text-teal-600 transition-colors line-clamp-1">
                            {item.title}
                          </span>
                          {item.type === "task" ? (
                            getPriorityBadge(
                              item.priority as
                                | "low"
                                | "medium"
                                | "high"
                                | undefined,
                            )
                          ) : item.type === "event" ? (
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Event
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                              Project
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[140px]">
                            {item.subtext}
                          </span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${isToday ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {isToday && <AlertCircle size={12} />}
                            {formatRelativeDays(item.dateKey)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventFormModal
        open={isEventModalOpen}
        onOpenChange={(open: boolean) => {
          setIsEventModalOpen(open);
          if (!open) setEditingEvent(undefined);
        }}
        entity={editingEvent}
        defaultDate={selectedDate || todayKey}
        currentUserId={currentUserId}
      />
    </div>
  );
}
