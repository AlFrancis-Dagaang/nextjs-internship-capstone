// components/tasks/tast-detail-modal/task-members-section.tsx
"use client"

import { Plus } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { TaskWithCommentCount } from "@/components/lists/board"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useToast } from "@/hooks/use-toast"
import { getTaskAssignees } from "@/lib/actions/task-assignees"
import type { Task } from "@/lib/db/schema"
import { AssignTaskModal } from "../modal/assign-task-modal"

type AssigneeUser = {
  id: string
  name?: string
  email?: string
  imageUrl?: string | null
  hasImage?: boolean | null
}

type TaskAssignee = {
  id: string
  taskId: string
  userId: string
  createdAt: Date
  userName: string
  userEmail: string
  userImageUrl?: string | null
  userHasImage?: boolean | null
}

type TaskMembersSectionProps = {
  task: Task
  projectId: string
  assignableUsers: AssigneeUser[]
  canEdit: boolean
  refreshKey?: number
  onUpdated?: (task: TaskWithCommentCount) => void
}

export function TaskMembersSection({
  task,
  projectId,
  assignableUsers = [],
  canEdit,
  refreshKey,
  onUpdated,
}: TaskMembersSectionProps) {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [assignees, setAssignees] = useState<TaskAssignee[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const taskRef = useRef(task)
  taskRef.current = task
  const onUpdatedRef = useRef(onUpdated)
  onUpdatedRef.current = onUpdated
  const lastAssigneeIdsRef = useRef<string>("")

  const fetchAssignees = useCallback(async () => {
    setIsLoading(true)
    const result = await getTaskAssignees(task.id)
    if (result.success) {
      setAssignees(result.data)

      const newIds = result.data
        .map((a) => a.userId)
        .sort()
        .join(",")
      if (newIds !== lastAssigneeIdsRef.current) {
        lastAssigneeIdsRef.current = newIds
        onUpdatedRef.current?.({
          ...taskRef.current,
          assignees: result.data.map((a: any) => ({
            userId: a.userId,
            name: a.userName,
            email: a.userEmail,
            imageUrl: a.userImageUrl,
            hasImage: a.userHasImage,
          })),
        })
      }
    } else {
      toast({
        title: "Failed to load assignees",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }, [task.id, toast])

  useEffect(() => {
    fetchAssignees()
  }, [fetchAssignees, refreshKey])

  const visibleAssignees = assignees.slice(0, 3)
  const extraCount = assignees.length > 3 ? assignees.length - 3 : 0

  const currentAssigneeUsers: AssigneeUser[] = assignees.map((a: any) => ({
    id: a.userId,
    name: a.userName,
    email: a.userEmail,
    imageUrl: a.userImageUrl,
    hasImage: a.userHasImage,
  }))

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
        Assignees
      </Label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={canEdit ? () => setModalOpen(true) : undefined}
          disabled={!canEdit}
          className={`flex items-center gap-2 rounded-xl p-1 -m-1 transition-colors ${
            canEdit ? "hover:bg-accent cursor-pointer" : "cursor-default"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-1.5 animate-pulse">
              <div className="flex -space-x-1.5">
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-card" />
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-card" />
              </div>
              <div className="h-3 w-16 bg-muted rounded ml-1" />
            </div>
          ) : assignees.length > 0 ? (
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center">
                <div className="flex -space-x-1.5">
                  {visibleAssignees.map((a: any) => {
                    const displayName = a.userName || a.userEmail || "U"
                    const stableKey = a.userId || a.userEmail || a.id
                    return (
                      <UserAvatar
                        key={a.id}
                        userId={stableKey}
                        name={displayName}
                        imageUrl={a.userImageUrl}
                        hasImage={a.userHasImage ?? false}
                        className="w-7 h-7"
                        title={displayName}
                      />
                    )
                  })}
                </div>
                {extraCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold border border-border/80">
                    +{extraCount}
                  </span>
                )}
              </div>
              {canEdit && (
                <div className="h-6 w-6 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-muted-foreground transition-colors">
                  <Plus size={12} className="text-muted-foreground" />
                </div>
              )}
            </div>
          ) : canEdit ? (
            <>
              <div className="h-7 w-7 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-muted-foreground transition-colors">
                <Plus size={14} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Assign</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              No assignees
            </span>
          )}

          {!isLoading && assignees.length > 0 && (
            <span className="text-xs text-foreground ml-1">
              {assignees.length} assigned
            </span>
          )}
        </button>
      </div>

      {canEdit && (
        <AssignTaskModal
          taskId={task.id}
          projectId={projectId}
          currentAssignees={currentAssigneeUsers}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={fetchAssignees}
        />
      )}
    </div>
  )
}
