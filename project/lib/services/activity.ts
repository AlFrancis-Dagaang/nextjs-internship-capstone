import { queries } from "@/lib/db";

type TaskActivityAction =
  | "created"
  | "updated"
  | "moved"
  | "priority_changed"
  | "due_date_changed"
  | "assignee_changed"
  | "description_changed"
  | "comment_added"
  | "comment_deleted"
  | "archived"
  | "restored"
  | "deleted"
  | "completed"
  | "reopened";

/**
 * Shared logging helper (resolves #62's open question in favor of a shared
 * helper over inline calls, consistent with #61's service-layer pattern).
 * Fire-and-forget from the caller's perspective — failures here shouldn't
 * fail the parent mutation, so errors are swallowed after logging to console.
 * Revisit if activity logging ever becomes user-facing-critical rather than
 * an audit trail.
 */
export async function logTaskActivity(
  taskId: string,
  actorId: string,
  action: TaskActivityAction,
  metadata?: Record<string, unknown>,
) {
  try {
    await queries.taskActivity.create({ taskId, actorId, action, metadata });
  } catch (err) {
    console.error("Failed to log task activity", { taskId, action, err });
  }
}
