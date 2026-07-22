"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-french_gray-300 dark:border-paynes_gray-400 bg-white/80 dark:bg-outer_space-500/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 text-outer_space-500 dark:text-platinum-500 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-paynes_gray-500 dark:text-french_gray-400 pointer-events-none"
              size={16}
            />
            <input
              type="search"
              placeholder="Search projects, tasks..."
              className="w-full pl-10 pr-4 py-2 bg-platinum-500 dark:bg-paynes_gray-400 border border-french_gray-300 dark:border-paynes_gray-300 rounded-lg text-outer_space-500 dark:text-platinum-500 placeholder-paynes_gray-500 dark:placeholder-french_gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-x-3 sm:gap-x-4">
          <button
            className="p-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 text-outer_space-500 dark:text-platinum-500 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell size={20} />
            {/* Optional notification badge dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue_munsell-500 rounded-full" />
          </button>

          <ThemeToggle />

          <div className="flex items-center pl-2 border-l border-french_gray-300 dark:border-paynes_gray-400">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
