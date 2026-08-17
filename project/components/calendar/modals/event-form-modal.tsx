"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventableProjects,
} from "@/lib/actions/events";
import type { CalendarEventDTO } from "@/types";
import {
  Link2,
  FolderKanban,
  X,
  Clock,
  Lock,
  Trash2,
  Pencil,
} from "lucide-react";
import { toLocalDateKey } from "@/lib/utils/utils";

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: CalendarEventDTO;
  currentUserId: string;
  defaultDate?: string;
}

function toISOStringLocal(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

// Helper to format "YYYY-MM-DD" into "Month Day, Year"
function formatReadableDate(dateStr: string) {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function EventFormModal({
  open,
  onOpenChange,
  entity,
  currentUserId,
  defaultDate,
}: EventFormModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [projectId, setProjectId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Existing events start in view-only mode.
  // New events start in editing mode.
  const [isEditing, setIsEditing] = useState(false);

  const [eventableProjects, setEventableProjects] = useState<
    { id: string; name: string }[] | null
  >(null);

  const [isProjectsLoading, startProjectsTransition] = useTransition();
  const [isSearchingProject, setIsSearchingProject] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  const resetFormFields = () => {
    setTitle(entity?.title ?? "");
    setDescription(entity?.description ?? "");

    setDate(
      entity?.startAt
        ? toLocalDateKey(new Date(entity.startAt))
        : (defaultDate ?? toLocalDateKey(new Date())),
    );

    setStartTime(
      entity?.startAt
        ? new Date(entity.startAt).toTimeString().slice(0, 5)
        : "09:00",
    );

    setEndTime(
      entity?.endAt
        ? new Date(entity.endAt).toTimeString().slice(0, 5)
        : "10:00",
    );

    setProjectId(entity?.projectId ?? "");
    setFieldErrors({});
    setIsSearchingProject(false);
    setProjectSearchQuery("");
  };

  useEffect(() => {
    if (!open) return;

    // Existing event = view mode
    // New event = edit mode
    setIsEditing(!entity);

    resetFormFields();

    if (entity?.projectId || entity) {
      startProjectsTransition(async () => {
        const res = await getEventableProjects();
        setEventableProjects(res.success && res.data ? res.data : []);
      });
    } else {
      setEventableProjects(null);
    }
  }, [open, entity, defaultDate]);

  const fetchProjectsIfNeeded = () => {
    if (!eventableProjects) {
      startProjectsTransition(async () => {
        const res = await getEventableProjects();
        setEventableProjects(res.success && res.data ? res.data : []);
      });
    }
  };

  const handleOpenProjectSearch = () => {
    setIsSearchingProject(true);
    fetchProjectsIfNeeded();
  };

  const filteredProjects = eventableProjects
    ? eventableProjects.filter((p) =>
        p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()),
      )
    : [];

  const selectedProject = eventableProjects?.find((p) => p.id === projectId);

  const selectedProjectName =
    selectedProject?.name ||
    (isProjectsLoading && projectId ? "Loading project..." : projectId);

  // Real authorization check.
  const userHasPermission = !entity
    ? true
    : entity.projectId
      ? eventableProjects !== null &&
        eventableProjects.some((p) => p.id === entity.projectId)
      : entity.creatorId === currentUserId;

  // Form inputs are editable only when:
  // 1. User has permission
  // 2. It's a new event OR editing mode is active
  const canEdit = userHasPermission && isEditing;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    /*
     * Safety guard:
     * An existing event must explicitly be in edit mode
     * before updateEvent() can ever be called.
     */
    if (entity && !isEditing) {
      return;
    }

    setFieldErrors({});

    const payload = {
      title,
      description: description || null,
      startAt: toISOStringLocal(date, startTime),
      endAt: toISOStringLocal(date, endTime),
      projectId: projectId || null,
    };

    startTransition(async () => {
      const result = entity
        ? await updateEvent(entity.id, payload)
        : await createEvent(payload);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }

        toast({
          title: "Couldn't save event",
          description: result.error,
          variant: "destructive",
        });

        return;
      }

      toast({
        title: entity ? "Event updated" : "Event created",
      });

      onOpenChange(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!entity) return;

    startTransition(async () => {
      const result = await deleteEvent(entity.id);

      if (!result.success) {
        toast({
          title: "Couldn't delete event",
          description: result.error,
          variant: "destructive",
        });

        return;
      }

      toast({
        title: "Event deleted",
      });

      onOpenChange(false);
      router.refresh();
    });
  }

  const renderProjectField = () => {
    /*
     * VIEW MODE
     */
    if (!canEdit) {
      return (
        <div className="flex items-center justify-between px-3.5 py-2.5 text-xs rounded-lg border border-border bg-muted/40 text-foreground shadow-2xs">
          <span className="font-medium flex items-center gap-2 truncate">
            {projectId ? (
              <>
                <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{selectedProjectName}</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-semibold">
                Personal
              </span>
            )}
          </span>
        </div>
      );
    }

    /*
     * EDIT MODE — PROJECT ALREADY SELECTED
     */
    if (projectId) {
      return (
        <div className="flex items-center justify-between px-3.5 py-2.5 text-xs rounded-lg border border-border bg-background text-foreground shadow-2xs">
          <span className="font-medium flex items-center gap-2 truncate">
            <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{selectedProjectName}</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setProjectId("");
              setIsSearchingProject(false);
              setProjectSearchQuery("");
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
            title="Clear project"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    /*
     * EDIT MODE — SEARCHING PROJECT
     */
    if (isSearchingProject) {
      return (
        <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-border bg-background shadow-2xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <button
              type="button"
              onClick={() => {
                setIsSearchingProject(false);
                setProjectSearchQuery("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 shrink-0 font-medium"
            >
              Cancel
            </button>
          </div>

          {isProjectsLoading ? (
            <p className="text-xs text-muted-foreground py-3 text-center">
              Loading projects...
            </p>
          ) : filteredProjects.length > 0 ? (
            <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProjectId(p.id);
                    setIsSearchingProject(false);
                    setProjectSearchQuery("");
                  }}
                  className="text-left px-3 py-2 text-xs rounded-md hover:bg-muted text-foreground transition-colors truncate font-medium"
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-3 text-center">
              No projects available
            </p>
          )}
        </div>
      );
    }

    /*
     * EDIT MODE — NO PROJECT
     */
    return (
      <div className="flex items-center justify-between px-3.5 py-2.5 text-xs rounded-lg border border-border bg-background text-foreground shadow-2xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-semibold">
          Personal
        </span>

        <button
          type="button"
          onClick={handleOpenProjectSearch}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
        >
          <Link2 className="w-4 h-4" />
          Attach to a project
        </button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border border-border p-6 sm:p-7 shadow-xl">
        <DialogHeader className="mb-2 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2.5">
            <span>
              {entity
                ? isEditing
                  ? "Edit Event"
                  : "Event Details"
                : "New Event"}{" "}
              for {formatReadableDate(date)}
            </span>

            {!userHasPermission && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60 shrink-0 shadow-2xs">
                <Lock className="w-3 h-3 text-muted-foreground" />
                View only
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
          {/* TITLE */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Title</span>

              {!canEdit && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Read-only
                </span>
              )}
            </label>

            <input
              type="text"
              required={canEdit}
              disabled={!canEdit}
              readOnly={!canEdit}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
              className="px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted/30 disabled:text-muted-foreground disabled:border-border/60 disabled:cursor-default"
            />

            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Description</span>

              {!canEdit && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Read-only
                </span>
              )}
            </label>

            <textarea
              disabled={!canEdit}
              readOnly={!canEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:bg-muted/30 disabled:text-muted-foreground disabled:border-border/60 disabled:cursor-default"
            />
          </div>

          {/* DATE */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </span>

              {!canEdit && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Read-only
                </span>
              )}
            </div>

            <input
              type="date"
              disabled={!canEdit}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:bg-transparent disabled:text-muted-foreground disabled:border-transparent disabled:cursor-default"
            />
          </div>

          {/* TIME RANGE */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Time Range
              </span>

              {!canEdit && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Read-only
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Start
                </span>

                <input
                  type="time"
                  disabled={!canEdit}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:bg-transparent disabled:text-muted-foreground disabled:border-transparent disabled:cursor-default"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  End
                </span>

                <input
                  type="time"
                  disabled={!canEdit}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:bg-transparent disabled:text-muted-foreground disabled:border-transparent disabled:cursor-default"
                />
              </div>
            </div>

            {fieldErrors.endAt && (
              <p className="text-xs text-destructive">{fieldErrors.endAt[0]}</p>
            )}
          </div>

          {/* PROJECT */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground">
              Project (Optional)
            </label>

            {renderProjectField()}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
            {/* DELETE */}
            {entity && userHasPermission && isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {/* EXISTING EVENT — VIEW MODE */}
              {entity && !isEditing && userHasPermission ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      /*
                       * Explicitly prevent this button from
                       * triggering the form submission.
                       */
                      e.preventDefault();
                      e.stopPropagation();

                      setIsEditing(true);
                    }}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </>
              ) : (
                /*
                 * EDIT MODE / NEW EVENT
                 */
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (entity) {
                        // Discard changes and return to view mode.
                        resetFormFields();
                        setIsEditing(false);
                      } else {
                        // New event: simply close the modal.
                        onOpenChange(false);
                      }
                    }}
                    disabled={isPending}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isPending
                      ? "Saving..."
                      : entity
                        ? "Save Changes"
                        : "Create Event"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
