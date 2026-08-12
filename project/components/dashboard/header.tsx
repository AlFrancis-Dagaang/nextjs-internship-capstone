// components/header.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Bell,
  Menu,
  Search,
  CheckCheck,
  FolderKanban,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { useToast } from "@/hooks/use-toast";
import { checkProjectAccess } from "@/lib/actions/notifications";
import { globalSearch, type SearchResult } from "@/lib/actions/search";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

type Notification = {
  id: string;
  type: string;
  message: string;
  projectId: string | null;
  taskId: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

function formatRelativeTime(dateStr: Date | string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult>({
    projects: [],
    tasks: [],
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fetchUnreadCount = async () => {
    const res = await getUnreadNotificationCount();
    if (res.success) {
      setUnreadCount(res.data);
    }
  };

  const fetchNotifications = async () => {
    const res = await getMyNotifications();
    if (res.success) {
      setNotifications(res.data);
    }
  };

  // Poll unread count on mount and periodically (every 45s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ projects: [], tasks: [] });
      setSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchOpen(true); // Open dropdown immediately to show loading state

    const handle = setTimeout(async () => {
      const res = await globalSearch(searchQuery);
      if (res.success) {
        setSearchResults(res.data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Navigation handlers for search results
  function handleProjectResultClick(projectId: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/projects/${projectId}`);
  }

  function handleTaskResultClick(projectId: string, taskId: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/projects/${projectId}?openTask=${taskId}`);
  }

  // Fetch notifications list when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsRead();
    if (res.success) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );
    }

    setIsOpen(false);

    if (!notification.projectId) return;

    const access = await checkProjectAccess(notification.projectId);
    if (!access.success) {
      toast({
        title: "No longer accessible",
        description: "You don't have access to this anymore.",
        variant: "destructive",
      });
      return;
    }

    if (notification.taskId) {
      router.push(
        `/projects/${notification.projectId}?openTask=${notification.taskId}`,
      );
    } else {
      router.push(`/projects/${notification.projectId}`);
    }
  };

  const hasResults =
    searchResults.projects.length > 0 || searchResults.tasks.length > 0;

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setSearchOpen(true);
                }
              }}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder="Search projects, tasks..."
              className="w-full pl-10 pr-4 py-2 bg-platinum-500 dark:bg-paynes_gray-400 border border-french_gray-300 dark:border-paynes_gray-300 rounded-lg text-outer_space-500 dark:text-platinum-500 placeholder-paynes_gray-500 dark:placeholder-french_gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 transition-all"
            />

            {searchOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto p-1.5 space-y-3"
                onMouseDown={(e) => e.preventDefault()} // Prevents blur closure on clicking scrollbar or results
              >
                {isSearching ? (
                  <div className="py-6 flex items-center justify-center space-x-2 text-xs text-neutral-400">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span>Searching...</span>
                  </div>
                ) : !hasResults ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.projects.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Projects
                        </div>
                        {searchResults.projects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleProjectResultClick(p.id)}
                            className="w-full text-left px-2.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-lg flex items-center space-x-2.5 transition-colors"
                          >
                            <FolderKanban
                              size={14}
                              className="text-blue-500 shrink-0"
                            />
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.tasks.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Tasks
                        </div>
                        {searchResults.tasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() =>
                              handleTaskResultClick(t.projectId, t.id)
                            }
                            className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/80 flex items-start space-x-2.5 transition-colors"
                          >
                            <CheckSquare
                              size={14}
                              className="text-cyan-500 shrink-0 mt-0.5"
                            />
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                {t.title}
                              </span>
                              <span className="text-[10px] text-neutral-400 truncate">
                                in {t.projectName}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-x-3 sm:gap-x-4">
          <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-paynes_gray-400 text-outer_space-500 dark:text-platinum-500 transition-colors relative"
                aria-label="View notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 min-w-[18px] h-[18px] bg-blue_munsell-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-2 space-y-1 text-left z-50"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={13} />
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onSelect={() => handleNotificationClick(notification)}
                      className={`cursor-pointer px-2.5 py-2 text-xs rounded-lg flex flex-col gap-1 focus:bg-neutral-100 dark:focus:bg-neutral-800 ${
                        !notification.isRead
                          ? "bg-blue-50/50 dark:bg-blue-950/20 font-semibold"
                          : "text-neutral-600 dark:text-neutral-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="leading-snug">
                          {notification.message}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue_munsell-500 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <span className="text-[10px] font-normal text-neutral-400">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <div className="flex items-center pl-2 border-l border-french_gray-300 dark:border-paynes_gray-400">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
