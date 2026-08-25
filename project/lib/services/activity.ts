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
