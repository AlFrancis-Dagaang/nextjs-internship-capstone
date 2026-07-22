"use client";

import type React from "react";
import { Suspense, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-platinum-900 dark:bg-outer_space-600 transition-colors">
      {/* Navigation Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Wrapper */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex justify-center p-12 text-outer_space-500 dark:text-platinum-500">
                Loading...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
