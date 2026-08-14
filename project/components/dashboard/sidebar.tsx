// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  FolderOpen,
  Home,
  Settings,
  Users,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Team", href: "/team", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/85 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col shrink-0 transition-[width] duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-64 lg:w-20" : "w-64"}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 font-bold text-foreground tracking-tight whitespace-nowrap overflow-hidden"
          >
            <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center text-background font-semibold text-sm shrink-0">
              G
            </div>
            <span
              className={`transition-all duration-300 origin-left truncate ${
                isCollapsed
                  ? "lg:opacity-0 lg:scale-95 lg:w-0"
                  : "opacity-100 scale-100 w-auto"
              }`}
            >
              GenZpace
            </span>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground transition-colors ml-auto"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 mt-6 px-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const current = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group relative whitespace-nowrap ${
                      current
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${isCollapsed ? "lg:justify-center" : ""}`}
                  >
                    <Icon
                      size={20}
                      className={
                        current
                          ? "text-foreground shrink-0"
                          : "text-muted-foreground shrink-0"
                      }
                    />
                    <span
                      className={`transition-all duration-300 origin-left truncate ${
                        isCollapsed
                          ? "lg:opacity-0 lg:scale-95 lg:w-0 lg:overflow-hidden"
                          : "opacity-100 scale-100 w-auto"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
