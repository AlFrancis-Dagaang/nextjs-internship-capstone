import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db";
import { syncUserFromClerkData } from "@/lib/services/users";

/**
 * Return-based auth check for use inside Server Actions, which need to
 * return a typed ActionResult rather than redirect. Re-derives the DB user
 * row from the Clerk session on every call — never trusts client input.
 *
 * Self-heals if the local `users` row doesn't exist yet (the `user.created`
 * webhook is async and can lag behind a fresh sign-up) — fetches the user
 * from Clerk directly and upserts via the shared sync helper, so an action
 * called right after sign-up doesn't fail with "User record not found"
 * while the webhook is still in flight.
 */
export async function getAuthedUserOrError() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" } as const;

  let user = await queries.users.getByClerkId(userId);

  if (!user) {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return { error: "User record not found" } as const;
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "Unknown";

    user = await syncUserFromClerkData(userId, primaryEmail, name);
  }

  return { user } as const;
}

/**
 * Redirect-based auth check for use in layouts/pages. Mirrors the inline
 * check previously in (dashboard)/layout.tsx exactly — Clerk-only, no DB
 * lookup — so behavior is unchanged.
 */
export async function requireAuthedUser() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}

/**
 * Redirect-based auth check for layouts/pages that need the DB user row,
 * not just the Clerk id. Delegates to getAuthedUserOrError for the
 * self-heal fallback, so there's one implementation instead of two.
 */
export async function requireAuthedDbUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const result = await getAuthedUserOrError();
  if ("error" in result) redirect("/sign-in");

  return result.user;
}
