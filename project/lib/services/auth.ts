import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db";

/**
 * Return-based auth check for use inside Server Actions, which need to
 * return a typed ActionResult rather than redirect. Re-derives the DB user
 * row from the Clerk session on every call — never trusts client input.
 */
export async function getAuthedUserOrError() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" } as const;

  const user = await queries.users.getByClerkId(userId);
  if (!user) return { error: "User record not found" } as const;

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
