import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toMemberList(
  rows: {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    role: "editor" | "viewer";
  }[],
) {
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    email: m.userEmail,
    name: m.userName,
    role: m.role,
  }));
}

// Local (not UTC) date key — must match CalendarView's own formatDateKey
// exactly, or events/tasks silently fail to match their day cell for
// any user not in UTC (or any event near a local midnight boundary).
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Added #74 — completion % label, computed live (no stored column).
// Zero active tasks is explicitly "No tasks yet", never "0%" — those
// mean different things (nothing to do yet, vs. nothing done yet).
export function getCompletionLabel(total: number, completed: number): string {
  if (total === 0) return "No tasks yet";
  return `${Math.round((completed / total) * 100)}%`;
}
