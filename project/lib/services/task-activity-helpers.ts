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
};

export function formatRelativeTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatActivityLabel(entry: {
  action: string;
  metadata: unknown;
}) {
  if (entry.action === "moved" && entry.metadata) {
    const meta = entry.metadata as any;
    return meta.fromListName
      ? `moved from ${meta.fromListName} to ${meta.toListName}`
      : `reordered within ${meta.listName}`;
  }
  if (entry.action === "priority_changed" && entry.metadata) {
    return `changed priority to ${(entry.metadata as any).to ?? "none"}`;
  }
  if (entry.action === "assignee_changed" && entry.metadata) {
    const meta = entry.metadata as any;
    if (meta.type === "assigned") {
      return `assigned ${meta.assigneeName} to this task`;
    }
    if (meta.type === "unassigned") {
      return `removed ${meta.assigneeName} from this task`;
    }
  }
  return ACTION_LABELS[entry.action] ?? entry.action;
}
