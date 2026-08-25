"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/topbar";

interface DashboardShellProps {
  children: React.ReactNode;
  currentUserId: string;
}

export function DashboardShell({
  children,
  currentUserId,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    // Reduced outer padding from p-4 lg:p-6 to p-2 sm:p-3
    <div className="flex h-full w-full gap-5 overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
      />

      {/* Reduced vertical gap between header and content from gap-6 to gap-3 */}
      <div className="flex-1 flex flex-col min-w-0 h-full gap-5 overflow-hidden">
        {/* Floating Topbar Header Card */}
        <div className="shrink-0">
          <Header
            setSidebarOpen={setSidebarOpen}
            currentUserId={currentUserId}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>

        {/* Scrollable Children Viewport */}
        <main className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
