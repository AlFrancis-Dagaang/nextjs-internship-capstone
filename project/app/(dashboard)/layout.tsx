// app/(dashboard)/layout.tsx
import { requireAuthedUser } from "@/lib/services/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthedUser();

  return <DashboardShell>{children}</DashboardShell>;
}
