"use server"

import { queries } from "@/lib/db"
import type { NotificationType } from "@/lib/db/schema"
import { getAuthedUserOrError } from "@/lib/services/auth"

export async function updateNotificationPreferences(
  patch: Partial<Record<NotificationType, boolean>>,
) {
  const result = await getAuthedUserOrError()
  if ("error" in result) return { success: false, error: result.error } as const

  const updated = await queries.users.updateNotificationPreferences(
    result.user.id,
    patch,
  )
  return { success: true, data: updated.notificationPreferences } as const
}
