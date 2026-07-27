"use server";

import { getAuthedUserOrError } from "@/lib/services/auth";

export async function getCurrentUserId(): Promise<string | null> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) return null;
  return authResult.user.id;
}
