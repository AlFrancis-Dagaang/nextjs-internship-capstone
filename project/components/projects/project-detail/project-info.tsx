// components/projects/project-detail/project-info.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import type { Project } from "@/lib/db/schema";
import type { CalendarEventDTO } from "@/types";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { getProjectEvents } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DeleteProjectModal } from "../modals/delete-project-modal";
import { ProjectEventsModal } from "../modals/project-events-moda";
import { EventFormModal } from "@/components/calendar/modals/event-form-modal";

type ProjectInfoProps = {
  project: Project;
  isOwner: boolean;
  currentUserId?: string;
  onProjectChanged?: (project: Project) => void;
  onProjectDeleted?: () => void;
};

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

function formatEventDateTime(startAt: string, endAt: string) {
  try {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const dateStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const startTimeStr = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const endTimeStr = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateStr}, ${startTimeStr} – ${endTimeStr}`;
  } catch {
    return `${startAt} – ${endAt}`;
  }
}

export function ProjectInfo({
  project,
  isOwner,
  currentUserId,
  onProjectChanged,
  onProjectDeleted,
}: ProjectInfoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Description editing state
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");

  // Due date state
  const [dueDate, setDueDate] = useState(toDateInputValue(project.dueDate));

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Events state
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<
    CalendarEventDTO | undefined
  >(undefined);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAllEventsModalOpen, setIsAllEventsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      setIsEventsLoading(true);
      const res = await getProjectEvents(project.id);
      if (isMounted) {
        if (res.success && res.data) {
          const formattedEvents: CalendarEventDTO[] = res.data.map((event) => ({
            ...event,
            startAt:
              event.startAt instanceof Date
                ? event.startAt.toISOString()
                : event.startAt,
            endAt:
              event.endAt instanceof Date
                ? event.endAt.toISOString()
                : event.endAt,
          }));
          setEvents(formattedEvents);
        }
        setIsEventsLoading(false);
      }
    }
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [project.id]);

  function handleEventClick(event: CalendarEventDTO) {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }

  function handleSaveDescription() {
    const submittedDesc = description;
    setIsEditingDesc(false);

    startTransition(async () => {
      const result = await updateProject(project.id, {
        description: submittedDesc || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update description",
          description: result.error,
          variant: "destructive",
        });
        setDescription(project.description ?? "");
        setIsEditingDesc(true);
        return;
      }

      toast({ title: "Project description updated" });
      onProjectChanged?.(result.data);
      router.refresh();
    });
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    setDueDate(newDate);
    const parsedDate = newDate ? new Date(newDate) : null;

    startTransition(async () => {
      const result = await updateProject(project.id, {
        dueDate: parsedDate || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update due date",
          description: result.error,
          variant: "destructive",
        });
        setDueDate(toDateInputValue(project.dueDate));
        return;
      }

      toast({ title: "Project due date updated" });
      onProjectChanged?.(result.data);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" was permanently deleted.`,
        });
        setDeleteOpen(false);
        onProjectDeleted?.();
        router.push("/projects");
        router.refresh();
      } else {
        toast({
          title: "Failed to delete project",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  const displayedEvents = events.slice(0, 2);

  return (
    <>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-border flex flex-col justify-between bg-muted/10">
        <div className="space-y-6">
          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Description
              </h4>
              {isOwner && !isEditingDesc && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDesc(true)}
                  className="h-7 text-xs shadow-none border-border bg-card text-foreground hover:bg-muted font-medium transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingDesc && isOwner ? (
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs focus-within:ring-1 focus-within:ring-ring">
                <Textarea
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="h-32 max-h-48 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-none shadow-none text-sm bg-card text-foreground px-3.5 py-3 overflow-y-auto"
                />
                <div className="p-2.5 flex justify-end gap-2 bg-muted/50 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-border bg-card text-foreground hover:bg-muted font-medium"
                    onClick={() => {
                      setDescription(project.description ?? "");
                      setIsEditingDesc(false);
                    }}
                    disabled={isPending}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-none"
                    onClick={handleSaveDescription}
                    disabled={isPending}
                    type="button"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => isOwner && setIsEditingDesc(true)}
                className={`p-4 rounded-xl bg-card border border-border/80 text-sm text-foreground leading-relaxed min-h-[100px] whitespace-pre-wrap shadow-2xs transition-all ${
                  isOwner
                    ? "hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                    : ""
                }`}
              >
                {project.description ? (
                  project.description
                ) : (
                  <span className="text-muted-foreground/60 italic font-normal">
                    No project description provided.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Events Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} /> Project Events
              </h4>
              {events.length > 2 && (
                <button
                  type="button"
                  onClick={() => setIsAllEventsModalOpen(true)}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  See all events ({events.length})
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {isEventsLoading ? (
                <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground shadow-2xs">
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground italic shadow-2xs">
                  No events scheduled for this project.
                </div>
              ) : (
                displayedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="group flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/85 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all shadow-2xs"
                  >
                    <div className="space-y-1 truncate pr-2">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                        {event.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {formatEventDateTime(event.startAt, event.endAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Project Metadata
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {/* Due Date Row */}
              <div className="p-3.5 rounded-xl bg-card border border-border/85 space-y-2 shadow-2xs">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-foreground" /> Due Date
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={handleDateChange}
                    disabled={!isOwner || isPending}
                    className="bg-background border-border text-foreground h-9 text-sm focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Created At Row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/85 shadow-2xs">
                <div className="flex items-center space-x-2.5 text-xs text-muted-foreground font-medium">
                  <Clock size={15} className="text-foreground" />
                  <span>Created At</span>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Danger Zone Footer */}
        {isOwner && (
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Danger Zone
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="h-8 text-xs rounded-lg shadow-none flex items-center gap-1.5 font-medium"
            >
              <Trash2 size={13} /> Delete Project
            </Button>
          </div>
        )}
      </div>

      <DeleteProjectModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        projectName={project.name}
        isPending={isPending}
      />

      <ProjectEventsModal
        open={isAllEventsModalOpen}
        onOpenChange={setIsAllEventsModalOpen}
        events={events}
        onSelectEvent={handleEventClick}
      />

      <EventFormModal
        open={isEventModalOpen}
        onOpenChange={(open) => {
          setIsEventModalOpen(open);
          if (!open) setSelectedEvent(undefined);
        }}
        entity={selectedEvent}
        currentUserId={currentUserId ?? ""}
      />
    </>
  );
}
