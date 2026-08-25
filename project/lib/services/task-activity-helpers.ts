export const ACTION_LABELS: Record<string, string> = {
  created: "created the task",
  updated: "updated the task",
  moved: "moved the task",
  priority_changed: "changed the priority",
  due_date_changed: "changed the due date",
  assignee_changed: "changed the assignee",
  description_changed: "changed the description",
  comment_added: "added a comment",
  comment_deleted: "deleted a comment",
  archived: "archived the task",
  restored: "restored the task",
  deleted: "deleted the task",
}

export function formatRelativeTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} days ago`
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function formatActivityLabel(entry: {
  action: string
  metadata: unknown
}) {
  if (entry.action === "moved" && entry.metadata) {
    const meta = entry.metadata as any
    return meta.fromListName
      ? `moved from ${meta.fromListName} to ${meta.toListName}`
      : `reordered within ${meta.listName}`
  }
  if (entry.action === "priority_changed" && entry.metadata) {
    return `changed priority to ${(entry.metadata as any).to ?? "none"}`
  }
  if (entry.action === "assignee_changed" && entry.metadata) {
    const meta = entry.metadata as any
    if (meta.type === "assigned") {
      return `assigned ${meta.assigneeName} to this task`
    }
    if (meta.type === "unassigned") {
      return `removed ${meta.assigneeName} from this task`
    }
  }
  return ACTION_LABELS[entry.action] ?? entry.action
}

export function formatDayLabel(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86400000,
  )

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7)
    return date.toLocaleDateString(undefined, { weekday: "long" })
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export function groupActivityByDay<T extends { createdAt: Date | string }>(
  items: T[],
) {
  const groups: { label: string; entries: T[] }[] = []
  for (const item of items) {
    const label = formatDayLabel(item.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.entries.push(item)
    } else {
      groups.push({ label, entries: [item] })
    }
  }
  return groups
}
