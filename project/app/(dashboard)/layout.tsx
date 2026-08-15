// app/(dashboard)/layout.tsx
import { requireAuthedDbUser } from "@/lib/services/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthedDbUser();

  // Clean layout return without redundant wrappers
  return <DashboardShell currentUserId={user.id}>{children}</DashboardShell>;
}
