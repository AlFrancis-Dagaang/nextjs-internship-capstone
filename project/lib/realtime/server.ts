import "server-only";
import Pusher from "pusher";
import type { Task, List, Project, ProjectMember } from "@/lib/db/schema";
import type { TaskWithCommentCount } from "@/components/lists/board";

// Server-only Pusher client. Never import this from a Client Component.
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// One discriminated union for all board mutations, mirroring the
// ActionResult<T> convention already used across lib/actions/*.
export type BoardRealtimeEvent =
  // Created/restored carry the enriched shape (not plain Task) — the local
  // optimistic path backfills commentCount/assignees via
  // replaceOptimisticTask, but a remote client has no such follow-up, so
  // the server must send the fully-enriched object up front. createTask
  // and restoreTask already compute this shape server-side (restoreTask's
  // enrichment is confirmed in catchup-pending.md) — publish that same
  // object rather than the raw insert result.
  | { type: "task_created"; task: TaskWithCommentCount }
  | { type: "task_updated"; task: Task }
  | { type: "task_moved"; task: Task; affectedTasks: Task[] }
  | { type: "task_deleted"; taskId: string; listId: string }
  | { type: "task_archived"; taskId: string }
  | { type: "task_restored"; task: TaskWithCommentCount }
  // NEW — assignee changes go through task-assignees.ts, never through
  // updateTask, so task_updated never fires for these. Publish the taskId
  // + listId (for the store lookup) + the resulting assignees array.
  | {
      type: "task_assignees_updated";
      taskId: string;
      listId: string;
      assignees: TaskWithCommentCount["assignees"];
    }
  // NEW — comment add/delete changes the card's visible count but never
  // touches the tasks row, so it also never fires task_updated. Mirrors
  // changeCommentCount's own (taskId, delta) signature exactly.
  | { type: "task_comment_count_changed"; taskId: string; delta: number }
  | { type: "list_created"; list: List }
  | { type: "list_updated"; list: List }
  | { type: "list_moved"; lists: List[] }
  | { type: "list_deleted"; listId: string };

export type ProjectMemberInfo = {
  memberId: string;
  userId: string;
  name?: string;
  email?: string;
  role: string;
};

// Separate discriminated union + separate Pusher event name ("project-event")
// on the same project-{projectId} channel — deliberately not merged into
// BoardRealtimeEvent/"board-event" so board-store's applyRemoteEvent (which
// only owns lists/tasks) is untouched by project-level changes.
export type ProjectRealtimeEvent =
  | { type: "project_updated"; project: Project }
  | { type: "member_added"; member: ProjectMemberInfo }
  | { type: "member_removed"; memberId: string; userId: string }
  | {
      type: "member_role_changed";
      memberId: string;
      userId: string;
      role: string;
    }
  | {
      type: "team_role_changed";
      projectTeamId: string;
      teamId: string;
      role: string;
    };

export async function publishProjectEvent(
  projectId: string,
  event: ProjectRealtimeEvent,
  originClientId?: string,
) {
  await pusherServer.trigger(`project-${projectId}`, "project-event", {
    ...event,
    originClientId,
  });
}

export type NotificationRealtimePayload = {
  id: string;
  type: string;
  message: string;
  projectId: string;
  taskId: string | null;
  isRead: boolean;
  createdAt: string;
};

/**
 * Publish a board mutation to every client subscribed to this project's
 * channel. `originClientId` lets the client that made the change skip its
 * own echo (it already applied the change optimistically).
 */
export async function publishBoardEvent(
  projectId: string,
  event: BoardRealtimeEvent,
  originClientId?: string,
) {
  await pusherServer.trigger(`project-${projectId}`, "board-event", {
    ...event,
    originClientId,
  });
}

/**
 * Publish a notification to one user's channel — replaces the 45s poll
 * from item 3. Call this from the same trigger points that currently
 * write to the `notifications` table (see lib/services/activity.ts /
 * wherever the 8 trigger types live).
 */
export async function publishNotification(
  userId: string,
  notification: NotificationRealtimePayload,
) {
  await pusherServer.trigger(`user-${userId}`, "notification", notification);
}
