// components/sidebar.tsx
"use client";

import {
  BarChart3,
  Calendar,
  CheckSquare,
  FolderOpen,
  Home,
  Layers,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  {
    name: "My Tasks",
    href: "/my-tasks",
    icon: CheckSquare,
  },
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
        className={`fixed lg:relative inset-y-0 left-0 z-50 bg-card border border-border/80 rounded-3xl flex flex-col shrink-0 transition-all duration-300 ease-in-out shadow-xs ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "w-64"}`}
      >
        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 border-b border-border/80 shrink-0 overflow-hidden">
          <Link
            href="/"
            className="flex items-center gap-3 font-bold text-foreground tracking-tight whitespace-nowrap w-full group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 shrink-0">
              <Layers size={20} />
            </div>
            <span
              className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap text-sm font-bold tracking-tight ${
                isCollapsed
                  ? "lg:w-0 lg:opacity-0 lg:pointer-events-none"
                  : "w-auto opacity-100"
              }`}
            >
              genzpace
            </span>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-auto shrink-0"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 mt-5 px-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1.5 flex flex-col items-stretch">
            {navigation.map((item) => {
              const current = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name} className="w-full">
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-x-3 text-xs font-semibold transition-colors duration-200 group relative whitespace-nowrap overflow-hidden px-3 py-2.5 w-full ${
                      current
                        ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    } ${isCollapsed ? "lg:rounded-full lg:w-11 lg:h-11 lg:mx-auto" : "rounded-2xl"}`}
                  >
                    <div className="flex items-center justify-center shrink-0 w-5">
                      <Icon
                        size={18}
                        className={
                          current
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground transition-colors"
                        }
                      />
                    </div>
                    <span
                      className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
                        isCollapsed
                          ? "lg:w-0 lg:opacity-0 lg:pointer-events-none"
                          : "w-auto opacity-100"
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
