// app/(dashboard)/layout.tsx
import type { ReactNode } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { requireAuthedDbUser } from "@/lib/services/auth"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireAuthedDbUser()

  return (
    <div className="h-screen w-screen bg-muted/40 p-3 sm:p-4 lg:p-6 flex gap-4 overflow-hidden">
      <DashboardShell currentUserId={user.id}>{children}</DashboardShell>
    </div>
  )
}
