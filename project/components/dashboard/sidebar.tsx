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
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border/80 flex flex-col shrink-0 transition-[width] duration-300 ease-in-out lg:translate-x-0 shadow-xs ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-64 lg:w-20" : "w-64"}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/80 shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-3 font-bold text-foreground tracking-tight whitespace-nowrap overflow-hidden ${
              isCollapsed ? "lg:justify-center lg:w-full lg:px-0" : ""
            }`}
          >
            <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
              G
            </div>
            <span
              className={`transition-all duration-300 origin-left truncate text-sm font-bold tracking-tight ${
                isCollapsed
                  ? "lg:opacity-0 lg:scale-95 lg:w-0 lg:hidden"
                  : "opacity-100 scale-100 w-auto"
              }`}
            >
              GenZpace
            </span>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-auto"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 mt-5 px-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1.5 flex flex-col items-center lg:items-stretch">
            {navigation.map((item) => {
              const current = pathname === item.href;
              const Icon = item.icon;
              return (
                <li
                  key={item.name}
                  className={
                    isCollapsed ? "w-full flex justify-center" : "w-full"
                  }
                >
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-x-3 text-xs font-semibold transition-all group relative whitespace-nowrap ${
                      current
                        ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    } ${
                      isCollapsed
                        ? "lg:w-11 lg:h-11 lg:justify-center lg:p-0 rounded-2xl"
                        : "px-3 py-2.5 rounded-2xl w-full"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        current
                          ? "text-primary-foreground shrink-0"
                          : "text-muted-foreground group-hover:text-foreground shrink-0 transition-colors"
                      }
                    />
                    <span
                      className={`transition-all duration-300 origin-left truncate ${
                        isCollapsed
                          ? "lg:opacity-0 lg:scale-95 lg:w-0 lg:overflow-hidden lg:hidden"
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
