import type { NotificationType } from "@/lib/db/schema";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  project_added: "Added to a project",
  project_removed: "Removed from a project",
  task_assigned: "Assigned to a task",
  task_unassigned: "Unassigned from a task",
  task_comment_added: "New comment on your task",
  task_moved: "Task moved between columns",
  task_archived: "Task archived",
  task_due_soon_24h: "Task due within 24 hours",
  task_due_soon_today: "Task due today",
  project_event_added: "New project event",
  team_member_added: "Team member added",
  team_member_removed: "Team member removed",
  team_attached_to_project: "Team attached to project",
};

export const ALL_NOTIFICATION_TYPES = Object.keys(
  NOTIFICATION_TYPE_LABELS,
) as NotificationType[];

// All types default to enabled — a missing key (new user, or a type
// added after this user last saved) is treated as "on" rather than "off".
export function isNotificationEnabled(
  prefs: Partial<Record<NotificationType, boolean>> | null | undefined,
  type: NotificationType,
): boolean {
  return prefs?.[type] ?? true;
}

// Merges stored prefs with defaults, for handing a complete 13-key
// object to the Settings UI (so it always renders every toggle, even
// for a user who's never saved before).
export function getEffectivePreferences(
  prefs: Partial<Record<NotificationType, boolean>> | null | undefined,
): Record<NotificationType, boolean> {
  return Object.fromEntries(
    ALL_NOTIFICATION_TYPES.map((type) => [
      type,
      isNotificationEnabled(prefs, type),
    ]),
  ) as Record<NotificationType, boolean>;
}
