import { queries } from "@/lib/db";
import type { NotificationType } from "@/lib/db/schema";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  message: string;
  projectId?: string;
  taskId?: string;
  actorId?: string;
}) {
  // Don't notify someone about their own action.
  if (params.actorId && params.actorId === params.userId) return;

  await queries.notifications.create({
    userId: params.userId,
    type: params.type,
    message: params.message,
    projectId: params.projectId ?? null,
    taskId: params.taskId ?? null,
    actorId: params.actorId ?? null,
  });
}

// Fan-out to every assignee of a task, skipping one excluded user
// (typically the actor who triggered the event).
export async function notifyTaskAssignees(params: {
  taskId: string;
  projectId: string;
  type: NotificationType;
  message: string;
  actorId?: string;
  excludeUserId?: string;
}) {
  const assignees = await queries.taskAssignees.getByTask(params.taskId);
  await Promise.all(
    assignees
      .filter((a) => a.userId !== params.excludeUserId)
      .map((a) =>
        createNotification({
          userId: a.userId,
          type: params.type,
          message: params.message,
          projectId: params.projectId,
          taskId: params.taskId,
          actorId: params.actorId,
        }),
      ),
  );
}
