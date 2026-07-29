// components/dashboard-shell.tsx
"use client";

import type React from "react";
import { Suspense, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-platinum-900 dark:bg-outer_space-600 transition-colors">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header setSidebarOpen={setSidebarOpen} />

        {/* Standard padding for all regular pages */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex justify-center p-12">Loading...</div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
