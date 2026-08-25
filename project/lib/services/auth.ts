import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db";
import { syncUserFromClerkData } from "@/lib/services/users";

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

    user = await syncUserFromClerkData(
      userId,
      primaryEmail,
      name,
      clerkUser.imageUrl,
      clerkUser.hasImage,
    );
  }

  return { user } as const;
}

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
