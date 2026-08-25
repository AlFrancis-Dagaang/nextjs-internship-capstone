// components/tasks/modal/task-actions.tsx
"use client"

import {
  Archive,
  Check,
  ChevronLeft,
  Edit2,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Move,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import type { ListWithTasks } from "@/components/lists/board"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useToast } from "@/hooks/use-toast"
import { getAssignableUsers } from "@/lib/actions/project-member"
import {
  assignUserToTask,
  getTaskAssignees,
} from "@/lib/actions/task-assignees"
import { archiveTask, moveTaskToList } from "@/lib/actions/tasks"
import type { Task } from "@/lib/db/schema"
import { useBoardStore } from "@/stores/board-store"

type AssigneeUser = {
  id: string
  name?: string
  email?: string
  imageUrl?: string | null
  hasImage?: boolean | null
}

export function TaskActions({
  taskId,
  projectId,
  currentListId,
  allLists,
  canEdit,
  canContribute,
  onAssigned,
  onView,
  onRename,
  onArchive,
  onDeleteClick,
  onMoved,
}: {
  taskId: string
  projectId: string
  currentListId: string
  allLists: ListWithTasks[]
  canEdit: boolean
  canContribute: boolean
  onView: () => void
  onRename: () => void
  onArchive: () => void
  onDeleteClick: () => void
  onMoved?: (task: Task, affectedTasks: Task[]) => void
  onAssigned?: (assignee: {
    userId: string
    name?: string
    email?: string
    imageUrl?: string | null
    hasImage?: boolean | null
  }) => void
}) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<"menu" | "move" | "assign">("menu")
  const [targetListId, setTargetListId] = useState(currentListId)
  const [position, setPosition] = useState("1")
  const [isMoving, startMoveTransition] = useTransition()

  const [assignableUsers, setAssignableUsers] = useState<AssigneeUser[]>([])
  const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(new Set())
  const [assignSearchQuery, setAssignSearchQuery] = useState("")
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false)
  const [, startAssignTransition] = useTransition()

  const applyOptimisticMove = useBoardStore((s) => s.applyOptimisticMove)
  const revertMoveSnapshot = useBoardStore((s) => s.revertMoveSnapshot)
  const archiveTaskLocally = useBoardStore((s) => s.archiveTaskLocally)
  const revertArchiveSnapshot = useBoardStore((s) => s.revertArchiveSnapshot)

  useEffect(() => {
    if (view === "move") {
      setTargetListId(currentListId)

      const currentList = allLists.find((l) => l.id === currentListId)
      const sortedTasks = currentList
        ? [...currentList.tasks].sort((a, b) => a.position - b.position)
        : []
      const currentIndex = sortedTasks.findIndex((t) => t.id === taskId)

      setPosition(currentIndex >= 0 ? String(currentIndex + 1) : "1")
    }
  }, [view, currentListId, allLists, taskId])

  useEffect(() => {
    if (view === "assign") {
      setAssignSearchQuery("")
      setIsLoadingAssignees(true)

      async function loadAssignData() {
        try {
          const [assigneesRes, candidatesRes] = await Promise.all([
            getTaskAssignees(taskId),
            getAssignableUsers(projectId),
          ])

          if (assigneesRes.success) {
            setAssignedUserIds(new Set(assigneesRes.data.map((a) => a.userId)))
          }
          if (candidatesRes.success) {
            setAssignableUsers(candidatesRes.data)
          }
        } catch (err) {
          console.error("Failed to load assignee options:", err)
        } finally {
          setIsLoadingAssignees(false)
        }
      }

      loadAssignData()
    }
  }, [view, taskId, projectId])

  const destTaskCount = (() => {
    const destList = allLists.find((l) => l.id === targetListId)
    if (!destList) return 0
    return targetListId === currentListId
      ? destList.tasks.filter((t) => t.id !== taskId).length
      : destList.tasks.length
  })()

  function handleMove() {
    const zeroIndexedPosition = parseInt(position, 10) - 1
    const snapshot = applyOptimisticMove(
      taskId,
      targetListId,
      zeroIndexedPosition,
    )
    setIsOpen(false)
    setView("menu")

    startMoveTransition(async () => {
      const result = await moveTaskToList(
        taskId,
        targetListId,
        zeroIndexedPosition,
      )
      if (!result.success) {
        revertMoveSnapshot(snapshot)
        toast({
          title: "Failed to move task",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({ title: "Task moved" })
      onMoved?.(result.data.movedTask, result.data.affectedTasks)
    })
  }

  function handleQuickAssign(user: AssigneeUser) {
    if (assignedUserIds.has(user.id)) return

    startAssignTransition(async () => {
      const result = await assignUserToTask(taskId, user.id)
      if (!result.success) {
        toast({
          title: "Failed to assign user",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setAssignedUserIds((prev) => new Set(prev).add(user.id))
      onAssigned?.({
        userId: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        hasImage: user.hasImage,
      })
      toast({
        title: "Member assigned",
        description: "Successfully added member to task.",
      })
    })
  }

  const filteredAssignableUsers = assignableUsers.filter((u) => {
    const q = assignSearchQuery.toLowerCase()
    const nameMatch = u.name?.toLowerCase().includes(q) ?? false
    const emailMatch = u.email?.toLowerCase().includes(q) ?? false
    return nameMatch || emailMatch
  })

  const positionOptions = Array.from({ length: destTaskCount + 1 }, (_, i) =>
    String(i + 1),
  )

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setTimeout(() => setView("menu"), 150)
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-card text-card-foreground border-border/80 rounded-2xl shadow-xl p-2 space-y-1 text-left z-50"
        onClick={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          const target = e.target as Element
          if (target.closest?.("[data-radix-popper-content-wrapper]")) {
            e.preventDefault()
          }
        }}
      >
        {view === "menu" ? (
          <>
            <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-muted-foreground border-b border-border/60 mb-1">
              <span>Task</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <DropdownMenuItem
              onSelect={() => {
                setIsOpen(false)
                onView()
              }}
              className="cursor-pointer px-2.5 py-2 text-xs font-medium text-foreground focus:bg-accent focus:text-accent-foreground rounded-xl flex items-center space-x-2.5"
            >
              <ExternalLink size={14} className="text-muted-foreground" />
              <span>View task</span>
            </DropdownMenuItem>

            {canEdit && (
              <div className="pt-1.5 pb-1 border-t border-border/60 mt-1">
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Management
                </div>
                <DropdownMenuItem
                  onSelect={() => {
                    setIsOpen(false)
                    onRename()
                  }}
                  className="cursor-pointer px-2.5 py-2 text-xs font-medium text-foreground focus:bg-accent focus:text-accent-foreground rounded-xl flex items-center space-x-2.5"
                >
                  <Edit2 size={14} className="text-muted-foreground" />
                  <span>Rename task</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={async () => {
                    setIsOpen(false)
                    const snapshot = archiveTaskLocally(taskId)
                    const result = await archiveTask(taskId)
                    if (result.success) {
                      toast({
                        title: "Task archived",
                        description: "Task has been successfully archived.",
                      })
                      onArchive()
                    } else {
                      revertArchiveSnapshot(snapshot)
                      toast({
                        title: "Failed to archive task",
                        description: result.error,
                        variant: "destructive",
                      })
                    }
                  }}
                  className="cursor-pointer px-2.5 py-2 text-xs font-medium text-foreground focus:bg-accent focus:text-accent-foreground rounded-xl flex items-center space-x-2.5"
                >
                  <Archive size={14} className="text-muted-foreground" />
                  <span>Archive task</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setView("assign")
                  }}
                  className="cursor-pointer px-2.5 py-2 text-xs font-medium text-foreground focus:bg-accent focus:text-accent-foreground rounded-xl flex items-center space-x-2.5"
                >
                  <UserPlus size={14} className="text-muted-foreground" />
                  <span>Assign member</span>
                </DropdownMenuItem>
              </div>
            )}

            {canContribute && (
              <div
                className={`pt-1.5 pb-1 ${!canEdit ? "border-t border-border/60 mt-1" : ""}`}
              >
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Actions
                </div>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setView("move")
                  }}
                  className="cursor-pointer px-2.5 py-2 text-xs font-medium text-foreground focus:bg-accent focus:text-accent-foreground rounded-xl flex items-center space-x-2.5"
                >
                  <Move size={14} className="text-muted-foreground" />
                  <span>Move task</span>
                </DropdownMenuItem>
              </div>
            )}

            {canEdit && (
              <div className="border-t border-border/60 pt-1 mt-1">
                <DropdownMenuItem
                  onSelect={() => {
                    setIsOpen(false)
                    onDeleteClick()
                  }}
                  className="cursor-pointer px-2.5 py-2 text-xs font-medium text-destructive focus:bg-destructive/10 rounded-xl flex items-center space-x-2.5"
                >
                  <Trash2 size={14} className="text-destructive" />
                  <span>Remove task</span>
                </DropdownMenuItem>
              </div>
            )}
          </>
        ) : view === "move" ? (
          <div className="p-1 space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60">
              <button
                onClick={() => setView("menu")}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-foreground">
                Move task
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-2 space-y-2.5 pt-1">
              <div className="flex gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    List
                  </label>
                  <Select value={targetListId} onValueChange={setTargetListId}>
                    <SelectTrigger className="w-full h-8 text-xs border border-border bg-secondary text-secondary-foreground rounded-xl shadow-2xs focus:ring-1 focus:ring-ring">
                      <SelectValue placeholder="Select list" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover text-popover-foreground border-border rounded-xl shadow-xl">
                      {allLists.map((list) => (
                        <SelectItem
                          key={list.id}
                          value={list.id}
                          className="rounded-lg text-xs"
                        >
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-20">
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Position
                  </label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="w-full h-8 text-xs border border-border bg-secondary text-secondary-foreground rounded-xl shadow-2xs focus:ring-1 focus:ring-ring">
                      <SelectValue placeholder="1" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover text-popover-foreground border-border rounded-xl shadow-xl">
                      {positionOptions.map((p) => (
                        <SelectItem
                          key={p}
                          value={p}
                          className="rounded-lg text-xs"
                        >
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="px-2 pt-2 pb-1">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-8 text-xs rounded-xl shadow-2xs cursor-pointer"
                disabled={isMoving}
                onClick={handleMove}
              >
                {isMoving ? "Moving..." : "Move"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-1 space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60">
              <button
                onClick={() => setView("menu")}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-foreground">
                Assign member
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-2 space-y-2.5 pt-1">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={13}
                />
                <Input
                  placeholder="Search members..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted border border-border rounded-xl shadow-2xs focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="max-h-44 overflow-y-auto divide-y divide-border/60 border border-border/80 rounded-xl bg-card">
                {isLoadingAssignees ? (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>Loading members...</span>
                  </div>
                ) : filteredAssignableUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No matching members found
                  </div>
                ) : (
                  filteredAssignableUsers.map((user) => {
                    const isAlreadyAssigned = assignedUserIds.has(user.id)
                    const displayName = user.name || user.email || "User"

                    return (
                      <div
                        key={user.id}
                        onClick={() =>
                          !isAlreadyAssigned && handleQuickAssign(user)
                        }
                        className={`px-2.5 py-2 flex items-center justify-between transition-colors ${
                          isAlreadyAssigned
                            ? "opacity-50 cursor-default"
                            : "hover:bg-accent/60 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar
                            userId={user.id}
                            name={displayName}
                            imageUrl={user.imageUrl}
                            hasImage={user.hasImage ?? false}
                            className="w-5 h-5 text-[9px]"
                          />
                          <span className="text-xs font-medium text-foreground truncate">
                            {displayName}
                          </span>
                        </div>
                        {isAlreadyAssigned && (
                          <Check size={13} className="text-primary shrink-0" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
