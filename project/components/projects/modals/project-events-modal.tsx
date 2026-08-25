"use client"

import { Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CalendarEventDTO } from "@/types"

interface ProjectEventsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: CalendarEventDTO[]
  onSelectEvent: (event: CalendarEventDTO) => void
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
    return `${dateStr} • ${startTimeStr} – ${endTimeStr}`
  } catch {
    return `${startAt} – ${endAt}`
  }
}

export function ProjectEventsModal({
  open,
  onOpenChange,
  events,
  onSelectEvent,
}: ProjectEventsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-135 bg-card text-card-foreground border border-border p-6 sm:p-7 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-semibold">All Project Events</span>
              <span className="text-xs font-normal text-muted-foreground">
                Showing all scheduled calendar events for this project
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {events.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic bg-muted/30 rounded-xl border border-border/60">
              No events scheduled for this project.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  onOpenChange(false)
                  onSelectEvent(event)
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 hover:bg-muted/40 cursor-pointer transition-all shadow-2xs"
              >
                <div className="space-y-1 truncate pr-3">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                    {event.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
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
      </DialogContent>
    </Dialog>
  )
}
