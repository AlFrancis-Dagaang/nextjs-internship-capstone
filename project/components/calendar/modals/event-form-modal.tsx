// components/calendar/modals/event-form-modal.tsx
"use client"

import {
  Clock,
  FolderKanban,
  Link2,
  Lock,
  Pencil,
  Trash2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  createEvent,
  deleteEvent,
  getEventableProjects,
  updateEvent,
} from "@/lib/actions/events"
import { toLocalDateKey } from "@/lib/utils/utils"
import type { CalendarEventDTO } from "@/types"

interface EventFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: CalendarEventDTO
  currentUserId: string
  defaultDate?: string
}

function toISOStringLocal(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

function formatReadableDate(dateStr: string) {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function EventFormModal({
  open,
  onOpenChange,
  entity,
  currentUserId,
  defaultDate,
}: EventFormModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [projectId, setProjectId] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [isEditing, setIsEditing] = useState(false)

  const [eventableProjects, setEventableProjects] = useState<
    { id: string; name: string }[] | null
  >(null)

  const [isProjectsLoading, startProjectsTransition] = useTransition()
  const [isSearchingProject, setIsSearchingProject] = useState(false)
  const [projectSearchQuery, setProjectSearchQuery] = useState("")

  const resetFormFields = () => {
    setTitle(entity?.title ?? "")
    setDescription(entity?.description ?? "")

    setDate(
      entity?.startAt
        ? toLocalDateKey(new Date(entity.startAt))
        : (defaultDate ?? toLocalDateKey(new Date())),
    )

    setStartTime(
      entity?.startAt
        ? new Date(entity.startAt).toTimeString().slice(0, 5)
        : "09:00",
    )

    setEndTime(
      entity?.endAt
        ? new Date(entity.endAt).toTimeString().slice(0, 5)
        : "10:00",
    )

    setProjectId(entity?.projectId ?? "")
    setFieldErrors({})
    setIsSearchingProject(false)
    setProjectSearchQuery("")
  }

  useEffect(() => {
    if (!open) return

    setIsEditing(!entity)
    resetFormFields()

    if (entity?.projectId || entity) {
      startProjectsTransition(async () => {
        const res = await getEventableProjects()
        setEventableProjects(res.success && res.data ? res.data : [])
      })
    } else {
      setEventableProjects(null)
    }
  }, [open, entity, defaultDate])

  const fetchProjectsIfNeeded = () => {
    if (!eventableProjects) {
      startProjectsTransition(async () => {
        const res = await getEventableProjects()
        setEventableProjects(res.success && res.data ? res.data : [])
      })
    }
  }

  const handleOpenProjectSearch = () => {
    setIsSearchingProject(true)
    fetchProjectsIfNeeded()
  }

  const filteredProjects = eventableProjects
    ? eventableProjects.filter((p) =>
        p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()),
      )
    : []

  const selectedProject = eventableProjects?.find((p) => p.id === projectId)

  const selectedProjectName =
    selectedProject?.name ||
    (isProjectsLoading && projectId ? "Loading project..." : projectId)

  const userHasPermission = !entity
    ? true
    : entity.projectId
      ? eventableProjects?.some((p) => p.id === entity.projectId)
      : entity.creatorId === currentUserId

  const canEdit = userHasPermission && isEditing

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (entity && !isEditing) {
      return
    }

    setFieldErrors({})

    const payload = {
      title,
      description: description || null,
      startAt: toISOStringLocal(date, startTime),
      endAt: toISOStringLocal(date, endTime),
      projectId: projectId || null,
    }

    startTransition(async () => {
      const result = entity
        ? await updateEvent(entity.id, payload)
        : await createEvent(payload)

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }

        toast({
          title: "Couldn't save event",
          description: result.error,
          variant: "destructive",
        })

        return
      }

      toast({
        title: entity ? "Event updated" : "Event created",
      })

      onOpenChange(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!entity) return

    startTransition(async () => {
      const result = await deleteEvent(entity.id)

      if (!result.success) {
        toast({
          title: "Couldn't delete event",
          description: result.error,
          variant: "destructive",
        })

        return
      }

      toast({
        title: "Event deleted",
      })

      onOpenChange(false)
      router.refresh()
    })
  }

  const renderProjectField = () => {
    if (!canEdit) {
      return (
        <div className="flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground shadow-2xs">
          <span className="font-semibold flex items-center gap-2 truncate">
            {projectId ? (
              <>
                <FolderKanban
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span className="truncate">{selectedProjectName}</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                Personal
              </span>
            )}
          </span>
        </div>
      )
    }

    if (projectId) {
      return (
        <div className="flex items-center justify-between px-3 py-2.5 text-xs rounded-xl border border-border bg-card text-foreground shadow-2xs">
          <span className="font-semibold flex items-center gap-2 truncate">
            <FolderKanban
              size={14}
              className="text-muted-foreground shrink-0"
            />
            <span className="truncate">{selectedProjectName}</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setProjectId("")
              setIsSearchingProject(false)
              setProjectSearchQuery("")
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Clear project"
          >
            <X size={13} />
          </button>
        </div>
      )
    }

    if (isSearchingProject) {
      return (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl border border-border bg-secondary/40 shadow-2xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-1 shadow-2xs"
            />

            <button
              type="button"
              onClick={() => {
                setIsSearchingProject(false)
                setProjectSearchQuery("")
              }}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 shrink-0 font-medium cursor-pointer bg-card border border-border rounded-xl"
            >
              Cancel
            </button>
          </div>

          {isProjectsLoading ? (
            <p className="text-xs text-muted-foreground py-3 text-center">
              Loading projects...
            </p>
          ) : filteredProjects.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProjectId(p.id)
                    setIsSearchingProject(false)
                    setProjectSearchQuery("")
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs rounded-xl hover:bg-card text-foreground transition-colors truncate font-medium flex items-center gap-2 border border-transparent hover:border-border cursor-pointer bg-card/60 shadow-2xs"
                >
                  <FolderKanban
                    size={13}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-3 text-center italic">
              No projects available
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between px-3 py-2.5 text-xs rounded-xl border border-border bg-card text-foreground shadow-2xs">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
          Personal
        </span>

        <button
          type="button"
          onClick={handleOpenProjectSearch}
          className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
        >
          <Link2 size={13} />
          Attach to a project
        </button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[420px] max-h-[85vh] bg-card text-card-foreground border border-border p-5 sm:p-6 shadow-2xl rounded-3xl flex flex-col overflow-hidden">
        <DialogHeader className="mb-1 flex flex-row items-center justify-between space-y-0 pb-2.5 border-b border-border/60 shrink-0">
          <DialogTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 truncate pr-2">
            <span className="truncate">
              {entity
                ? isEditing
                  ? "Edit Event"
                  : "Event Details"
                : "New Event"}{" "}
              <span className="text-muted-foreground font-normal">
                ({formatReadableDate(date)})
              </span>
            </span>

            {!userHasPermission && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60 shrink-0">
                <Lock size={10} className="text-muted-foreground" />
                View only
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
            {/* TITLE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Title</span>
                {!canEdit && (
                  <span className="text-[10px] font-normal text-muted-foreground">
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
                className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-1 disabled:bg-muted/30 disabled:text-muted-foreground disabled:border-border/60 disabled:cursor-default"
              />

              {fieldErrors.title && (
                <p className="text-[11px] text-destructive">
                  {fieldErrors.title[0]}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Description</span>
                {!canEdit && (
                  <span className="text-[10px] font-normal text-muted-foreground">
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
                className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-1 resize-none disabled:bg-muted/30 disabled:text-muted-foreground disabled:border-border/60 disabled:cursor-default"
              />
            </div>

            {/* DATE */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Date
                </span>
                {!canEdit && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    Read-only
                  </span>
                )}
              </div>

              <input
                type="date"
                disabled={!canEdit}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 cursor-pointer disabled:bg-transparent disabled:text-muted-foreground disabled:border-transparent disabled:cursor-default"
              />
            </div>

            {/* TIME RANGE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock
                    size={13}
                    className="text-teal-600 dark:text-teal-400"
                  />
                  Time Range
                </span>
                {!canEdit && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    Read-only
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2.5 bg-secondary/50 p-3 rounded-2xl border border-border/60">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Start
                  </span>

                  <input
                    type="time"
                    disabled={!canEdit}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 cursor-pointer disabled:bg-transparent disabled:text-muted-foreground disabled:border-transparent disabled:cursor-default"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    End
                  </span>

                  <input
                    type="time"
                    disabled={!canEdit}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 cursor-pointer disabled:bg-transparent disabled:text-muted-foreground disabled:border-transparent disabled:cursor-default"
                  />
                </div>
              </div>

              {fieldErrors.endAt && (
                <p className="text-[11px] text-destructive">
                  {fieldErrors.endAt[0]}
                </p>
              )}
            </div>

            {/* PROJECT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Project (Optional)
              </label>
              {renderProjectField()}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-2 shrink-0">
            {entity && userHasPermission && isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={13} />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {entity && !isEditing && userHasPermission ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="h-8 px-3.5 text-xs font-semibold rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-2xs cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    className="h-8 px-3.5 text-xs font-semibold rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (entity) {
                        resetFormFields()
                        setIsEditing(false)
                      } else {
                        onOpenChange(false)
                      }
                    }}
                    disabled={isPending}
                    className="h-8 px-3.5 text-xs font-semibold rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-8 px-4 text-xs font-semibold rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
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
  )
}
