"use server";

import { queries } from "@/lib/db";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertProjectViewAccess } from "@/lib/services/ownership";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getMyNotifications(): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.notifications.getByUser>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }
  const data = await queries.notifications.getByUser(authResult.user.id);
  return { success: true, data };
}

export async function getUnreadNotificationCount(): Promise<
  ActionResult<number>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }
  const count = await queries.notifications.getUnreadCount(authResult.user.id);
  return { success: true, data: count };
}

export async function markNotificationRead(
  id: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }
  const existing = await queries.notifications.getById(id);
  if (!existing) {
    return { success: false, error: "Not found" };
  }
  if (existing.userId !== authResult.user.id) {
    return { success: false, error: "Forbidden" };
  }
  await queries.notifications.markRead(id);
  return { success: true, data: null };
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }
  await queries.notifications.markAllReadForUser(authResult.user.id);
  return { success: true, data: null };
}

export async function checkProjectAccess(
  projectId: string,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }
  const access = await assertProjectViewAccess(projectId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "No access" };
  }
  return { success: true, data: null };
}
