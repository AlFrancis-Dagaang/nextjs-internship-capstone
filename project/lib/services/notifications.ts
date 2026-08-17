import { queries } from "@/lib/db";
import type { NotificationType } from "@/lib/db/schema";
import { publishNotification } from "@/lib/realtime/server";

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

  const notification = await queries.notifications.create({
    userId: params.userId,
    type: params.type,
    message: params.message,
    projectId: params.projectId ?? null,
    taskId: params.taskId ?? null,
    actorId: params.actorId ?? null,
  });

  // NotificationRealtimePayload requires projectId — only publish when
  // one exists (every current call site passes it, but the param is
  // typed optional, so guard rather than assume).
  if (params.projectId) {
    await publishNotification(params.userId, {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      projectId: params.projectId,
      taskId: notification.taskId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    });
  }
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
// Fan-out to every member of a project (via project_members) PLUS the
// owner (who has no project_members row — #29 keeps ownership as the
// single source of truth, so it's not covered by getByProject alone).
// Unlike notifyTaskAssignees, there's no excludeUserId param needed —
// createNotification already self-skips when actorId === userId, and
// the actor is always a project member/owner by definition here (they
// had to pass assertProjectEditAccess to create the event).
export async function notifyProjectMembers(params: {
  projectId: string;
  type: NotificationType;
  message: string;
  actorId: string;
}) {
  const project = await queries.projects.getById(params.projectId);
  if (!project) return;

  const members = await queries.projectMembers.getByProject(params.projectId);

  const recipientIds = new Set([
    project.ownerId,
    ...members.map((m) => m.userId),
  ]);

  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      createNotification({
        userId,
        type: params.type,
        message: params.message,
        projectId: params.projectId,
        actorId: params.actorId,
      }),
    ),
  );
}
