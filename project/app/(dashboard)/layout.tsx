// app/(dashboard)/layout.tsx
import { requireAuthedUser } from "@/lib/services/auth";
import { queries } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUserId = await requireAuthedUser();
  const user = await queries.users.getByClerkId(clerkUserId);

  return <DashboardShell currentUserId={user!.id}>{children}</DashboardShell>;
}
