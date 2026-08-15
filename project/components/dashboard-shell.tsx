// components/dashboard-shell.tsx
"use client";

import type React from "react";
import { Suspense, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export function DashboardShell({
  children,
  currentUserId,
}: {
  children: React.ReactNode;
  currentUserId: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex overflow-x-hidden">
      {/* Sidebar handles its own fixed/sticky responsive behavior */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
      />

      {/* Main Content Area: Synchronized margin and width adjustment */}
      <div
        className={`flex flex-col flex-1 min-h-screen min-w-0 transition-[margin,width] duration-300 ease-in-out ${
          isCollapsed
            ? "lg:ml-20 lg:w-[calc(100%-5rem)]"
            : "lg:ml-64 lg:w-[calc(100%-16rem)]"
        }`}
      >
        {/* Fixed Header Container pinned to top viewport */}
        <div
          className={`fixed top-0 right-0 z-30 transition-[left,width] duration-300 ease-in-out bg-card border-b border-border shadow-sm ${
            isCollapsed
              ? "lg:left-20 lg:w-[calc(100%-5rem)]"
              : "lg:left-64 lg:w-[calc(100%-16rem)]"
          } left-0 w-full`}
        >
          <Header
            setSidebarOpen={setSidebarOpen}
            currentUserId={currentUserId}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>

        {/* Main Content Container with an explicit mt-16 (64px) to push it below the fixed header */}
        <main className="flex-1 w-full min-w-0 mt-16 p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full min-w-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  Loading...
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
