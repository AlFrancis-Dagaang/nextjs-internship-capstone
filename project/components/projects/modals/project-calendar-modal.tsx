"use client"

import { AlertCircle, Calendar, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { EventFormModal } from "@/components/calendar/modals/event-form-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getProjectEvents } from "@/lib/actions/events"
import type { CalendarEventDTO, CalendarTaskDTO } from "@/types"

interface ProjectCalendarModalProps {
  projectId: string
  projectName: string
  upcomingTasks: CalendarTaskDTO[]
  currentUserId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatReadableDate(dateStr: string) {
  try {
    if (!dateStr) return ""
    const cleanDateStr = dateStr.split("T")[0]
    const [year, month, day] = cleanDateStr.split("-").map(Number)
    if (!year || !month || !day) {
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatEventDateTime(startAt: string, endAt: string) {
  try {
    const start = new Date(startAt)
    const end = new Date(endAt)
    const dateStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const startTimeStr = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    const endTimeStr = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    return `${dateStr}, ${startTimeStr} – ${endTimeStr}`
  } catch {
    return `${startAt} – ${endAt}`
  }
}

export function ProjectCalendarModal({
  projectId,
  projectName,
  upcomingTasks,
  currentUserId,
  open,
  onOpenChange,
}: ProjectCalendarModalProps) {
  const router = useRouter()

  const [events, setEvents] = useState<CalendarEventDTO[]>([])
  const [isEventsLoading, startEventsTransition] = useTransition()
  const [selectedEvent, setSelectedEvent] = useState<
    CalendarEventDTO | undefined
  >()
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)

  // Toggle state between "tasks" and "events"
  const [activeTab, setActiveTab] = useState<"tasks" | "events">("tasks")

  // Filter state for task deadlines ("upcoming" | "overdue" | "all")
  const [deadlineFilter, setDeadlineFilter] = useState<
    "upcoming" | "overdue" | "all"
  >("upcoming")

  useEffect(() => {
    if (!open) return
    startEventsTransition(async () => {
      const res = await getProjectEvents(projectId)
      if (res.success) {
        setEvents(
          res.data.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startAt:
              e.startAt instanceof Date
                ? e.startAt.toISOString()
                : String(e.startAt),
            endAt:
              e.endAt instanceof Date ? e.endAt.toISOString() : String(e.endAt),
            projectId: e.projectId,
            creatorId: e.creatorId,
          })),
        )
      }
    })
  }, [open, projectId])

  const todayStr = new Date().toISOString().split("T")[0]

  // Filter tasks based on deadline filter and completion status
  const filteredTasks = upcomingTasks.filter((task) => {
    if (!task.dueDate) return false

    const taskDateOnly = task.dueDate.split("T")[0]
    const isOverdue = taskDateOnly < todayStr && !task.isCompleted
    const isUpcoming = taskDateOnly >= todayStr && !task.isCompleted

    if (deadlineFilter === "upcoming") return isUpcoming
    if (deadlineFilter === "overdue") return isOverdue
    return true // "all"
  })

  function handleTaskClick(taskId: string) {
    onOpenChange(false)
    router.push(`/projects/${projectId}?openTask=${taskId}`)
  }

  function handleEventClick(event: CalendarEventDTO) {
    setSelectedEvent(event)
    setIsEventFormOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] bg-card text-card-foreground border border-border p-6 sm:p-7 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base sm:text-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground tracking-tight text-sm sm:text-base">
                    Project Schedule & Milestones
                  </span>
                  <span className="text-xs font-normal text-muted-foreground mt-0.5">
                    {projectName}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border shrink-0">
                Workspace Calendar
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Fixed height container to prevent layout jumping or stretching */}
          <div className="flex flex-col h-[400px] gap-4">
            {/* Main Switcher Tab Header */}
            <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "tasks"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertCircle size={13} /> Deadlines (
                {
                  upcomingTasks.filter(
                    (t) =>
                      t.dueDate &&
                      !t.isCompleted &&
                      (t.dueDate.split("T")[0] >= todayStr ||
                        t.dueDate.split("T")[0] < todayStr),
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "events"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar size={13} /> Project Events ({events.length})
              </button>
            </div>

            {/* Scrollable Content Container with fixed height */}
            <div className="flex-1 overflow-y-auto pr-1">
              {/* TAB 1: DEADLINES VIEW */}
              {activeTab === "tasks" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={13} /> Task Deadlines
                    </h4>
                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-[11px] font-medium">
                      <button
                        type="button"
                        onClick={() => setDeadlineFilter("upcoming")}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          deadlineFilter === "upcoming"
                            ? "bg-background text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlineFilter("overdue")}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          deadlineFilter === "overdue"
                            ? "bg-background text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Overdue
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlineFilter("all")}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          deadlineFilter === "all"
                            ? "bg-background text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {filteredTasks.length === 0 ? (
                      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground italic text-center">
                        {deadlineFilter === "overdue"
                          ? "No overdue deadlines."
                          : deadlineFilter === "upcoming"
                            ? "No upcoming deadlines."
                            : "No deadlines found."}
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const priorityColor =
                          task.priority === "high"
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : task.priority === "medium"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-muted text-muted-foreground border-border"

                        const taskDateOnly = task.dueDate
                          ? task.dueDate.split("T")[0]
                          : ""
                        const isOverdue =
                          taskDateOnly < todayStr && !task.isCompleted

                        return (
                          <div
                            key={task.id}
                            onClick={() => handleTaskClick(task.id)}
                            className="group flex flex-col items-start p-3.5 rounded-xl bg-card border border-border cursor-pointer hover:border-ring hover:shadow-xs transition-all gap-2"
                          >
                            {/* Title */}
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {task.title}
                              </span>
                              {task.isCompleted && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                  Completed
                                </span>
                              )}
                            </div>

                            {/* Due Date & Priority Stacked Vertically */}
                            <div className="flex flex-col gap-1.5 w-full items-start">
                              <span
                                className={`text-[11px] flex items-center gap-1 font-medium ${
                                  isOverdue
                                    ? "text-destructive font-semibold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <Clock size={11} /> Due{" "}
                                {formatReadableDate(task.dueDate)}
                                {isOverdue && " (Overdue)"}
                              </span>

                              {task.priority && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border w-fit ${priorityColor}`}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EVENTS VIEW */}
              {activeTab === "events" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} /> Project Events
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {isEventsLoading ? (
                      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground text-center">
                        Loading events...
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground italic text-center">
                        No events scheduled.
                      </div>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="group flex items-center justify-between p-3.5 rounded-xl bg-card border border-border cursor-pointer hover:border-ring hover:shadow-xs transition-all"
                        >
                          <div className="space-y-1 truncate pr-3">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                              {event.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Clock size={11} />{" "}
                              {formatEventDateTime(event.startAt, event.endAt)}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            View →
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EventFormModal
        open={isEventFormOpen}
        onOpenChange={(open) => {
          setIsEventFormOpen(open)
          if (!open) setSelectedEvent(undefined)
        }}
        entity={selectedEvent}
        currentUserId={currentUserId}
      />
    </>
  )
}
