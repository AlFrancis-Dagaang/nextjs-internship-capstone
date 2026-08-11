"use server";

import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import {
  assertTaskViewAccess,
  assertTaskEditAccess,
} from "@/lib/services/ownership";
import { logTaskActivity } from "@/lib/services/activity";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/services/notifications";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getTaskAssignees(
  taskId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.taskAssignees.getByTask>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertTaskViewAccess(taskId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const assignees = await queries.taskAssignees.getByTask(taskId);
  return { success: true, data: assignees };
}

export async function assignUserToTask(
  taskId: string,
  userId: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertTaskEditAccess(taskId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  // Validate the target user is actually eligible: project owner or a
  // project_members row for this task's project — closes the gap flagged
  // earlier where any valid user id could be assigned regardless of
  // whether they have any access to the project at all.
  const isOwner = access.project.ownerId === userId;
  const membership = isOwner
    ? null
    : await queries.projectMembers.getByProjectAndUser(
        access.project.id,
        userId,
      );
  if (!isOwner && !membership) {
    return {
      success: false,
      error: "User is not a member of this project",
    };
  }

  const existing = await queries.taskAssignees.getByTaskAndUser(taskId, userId);
  if (existing) {
    return { success: false, error: "User is already assigned" };
  }

  await queries.taskAssignees.add(taskId, userId);
  const assignedUser = await queries.users.getById(userId);
  const actor = await queries.users.getById(authResult.user.id);

  await logTaskActivity(taskId, authResult.user.id, "assignee_changed", {
    type: "assigned",
    assigneeId: userId,
    assigneeName: assignedUser?.name ?? "Unknown user",
  });
  await createNotification({
    userId,
    type: "task_assigned",
    message: `${actor?.name ?? "Someone"} assigned you to a task`, // FIXED — use actor, not assignedUser
    projectId: access.project.id,
    taskId,
    actorId: authResult.user.id,
  });

  revalidatePath(`/projects/${access.project.id}`);

  return { success: true, data: null };
}

export async function unassignUserFromTask(
  taskId: string,
  userId: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertTaskEditAccess(taskId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  await queries.taskAssignees.remove(taskId, userId);
  const unassignedUser = await queries.users.getById(userId);
  const actor = await queries.users.getById(authResult.user.id); // ADD THIS

  await logTaskActivity(taskId, authResult.user.id, "assignee_changed", {
    type: "unassigned",
    assigneeId: userId,
    assigneeName: unassignedUser?.name ?? "Unknown user",
  });
  await createNotification({
    userId,
    type: "task_unassigned",
    message: `${actor?.name ?? "Someone"} removed you from a task`, // FIXED
    projectId: access.project.id,
    taskId,
    actorId: authResult.user.id,
  });
  revalidatePath(`/projects/${access.project.id}`);

  return { success: true, data: null };
}
