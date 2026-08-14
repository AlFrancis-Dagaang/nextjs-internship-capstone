import type { TaskWithCommentCount } from "@/components/lists/board";

export type TaskFilters = {
  searchQuery: string;
  filterCompleted: "all" | "completed" | "incomplete";
  filterPriority: "all" | "low" | "medium" | "high";
  filterDueDate: "all" | "overdue" | "today" | "this_week" | "none";
  filterAssignedToMe: boolean;
  filterAssigneeId: string | null;
};

export function isFilteringActive(f: TaskFilters): boolean {
  return (
    f.searchQuery.trim() !== "" ||
    f.filterCompleted !== "all" ||
    f.filterPriority !== "all" ||
    f.filterDueDate !== "all" ||
    f.filterAssignedToMe ||
    f.filterAssigneeId !== null
  );
}

export function taskMatchesFilters(
  task: TaskWithCommentCount,
  f: TaskFilters,
  currentUserId: string | null,
): boolean {
  if (f.searchQuery.trim() !== "") {
    const q = f.searchQuery.trim().toLowerCase();
    const titleMatch = task.title.toLowerCase().includes(q);
    const descMatch = task.description?.toLowerCase().includes(q) ?? false;
    if (!titleMatch && !descMatch) return false;
  }

  if (f.filterCompleted === "completed" && !task.isCompleted) return false;
  if (f.filterCompleted === "incomplete" && task.isCompleted) return false;

  if (f.filterPriority !== "all" && task.priority !== f.filterPriority) {
    return false;
  }

  if (f.filterDueDate !== "all") {
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    if (f.filterDueDate === "none" && due !== null) return false;
    if (f.filterDueDate !== "none") {
      if (due === null) return false;
      if (f.filterDueDate === "overdue" && !(due < now && !task.isCompleted)) {
        return false;
      }
      if (
        f.filterDueDate === "today" &&
        !(due >= startOfToday && due <= endOfToday)
      ) {
        return false;
      }
      if (
        f.filterDueDate === "this_week" &&
        !(due >= startOfToday && due <= endOfWeek)
      ) {
        return false;
      }
    }
  }

  if (f.filterAssignedToMe) {
    const isAssignedToMe =
      currentUserId != null &&
      (task.assignees ?? []).some((a) => a.userId === currentUserId);
    if (!isAssignedToMe) return false;
  }

  if (f.filterAssigneeId) {
    const hasAssignee = (task.assignees ?? []).some(
      (a) => a.userId === f.filterAssigneeId,
    );
    if (!hasAssignee) return false;
  }

  return true;
}
