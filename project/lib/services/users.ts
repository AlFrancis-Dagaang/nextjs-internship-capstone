import { queries } from "@/lib/db";

/**
 * Single place that turns Clerk user data into a local `users` row.
 * Called from the webhook (primary sync path) and from
 * requireAuthedDbUser's self-heal fallback (race-condition backup) —
 * keep both call sites going through this instead of duplicating the
 * upsert shape.
 */
export async function syncUserFromClerkData(
  clerkId: string,
  primaryEmail: string,
  name: string,
) {
  return queries.users.upsert({ clerkId, email: primaryEmail, name });
}
