// components/header.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Bell,
  Menu,
  Search,
  CheckCheck,
  FolderKanban,
  CheckSquare,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { UserAvatar } from "@/components/ui/user-avatar";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  currentUserId: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
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

export function Header({
  setSidebarOpen,
  currentUserId,
  isCollapsed,
  setIsCollapsed,
}: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { signOut } = useClerk();

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

  useRealtimeNotifications(currentUserId, (notification) => {
    setNotifications((prev) => [
      {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        projectId: notification.projectId,
        taskId: notification.taskId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
      ...prev,
    ]);
    setUnreadCount((prev) => prev + 1);
  });

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ projects: [], tasks: [] });
      setSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchOpen(true);

    const handle = setTimeout(async () => {
      const res = await globalSearch(searchQuery);
      if (res.success) {
        setSearchResults(res.data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

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

  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "User";

  return (
    <header className="flex h-16 items-center gap-x-4 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8 w-full">
      {/* Left side: Mobile menu toggle, Desktop sidebar collapse toggle, and Search */}
      <div className="flex items-center gap-x-3 flex-1">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar collapse trigger */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>

        {/* Search Bar Container */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
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
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />

          {searchOpen && (
            <div
              className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto p-1.5 space-y-3"
              onMouseDown={(e) => e.preventDefault()}
            >
              {isSearching ? (
                <div className="py-6 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <Loader2 size={16} className="animate-spin text-foreground" />
                  <span>Searching...</span>
                </div>
              ) : !hasResults ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.projects.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Projects
                      </div>
                      {searchResults.projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProjectResultClick(p.id)}
                          className="w-full text-left px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted/50 rounded-lg flex items-center space-x-2.5 transition-colors"
                        >
                          <FolderKanban
                            size={14}
                            className="text-foreground shrink-0"
                          />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.tasks.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Tasks
                      </div>
                      {searchResults.tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() =>
                            handleTaskResultClick(t.projectId, t.id)
                          }
                          className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-muted/50 flex items-start space-x-2.5 transition-colors"
                        >
                          <CheckSquare
                            size={14}
                            className="text-muted-foreground shrink-0 mt-0.5"
                          />
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="font-medium text-foreground truncate">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
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

      {/* Right side actions */}
      <div className="flex items-center gap-x-3 sm:gap-x-4">
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors relative"
              aria-label="View notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-card shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-80 bg-card border border-border rounded-xl shadow-2xl p-2 space-y-1 text-left z-50"
          >
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border mb-1">
              <span className="text-xs font-semibold text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-foreground hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={13} />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onSelect={() => handleNotificationClick(notification)}
                    className={`cursor-pointer px-2.5 py-2 text-xs rounded-lg flex flex-col gap-1 focus:bg-muted ${
                      !notification.isRead
                        ? "bg-muted/60 font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="leading-snug text-foreground">
                        {notification.message}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {/* Custom User Avatar Dropdown */}
        <div className="flex items-center pl-2 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label="User menu"
              >
                <UserAvatar
                  userId={currentUserId}
                  name={displayName}
                  imageUrl={user?.imageUrl}
                  hasImage={!!user?.hasImage}
                  className="w-8 h-8 text-xs rounded-full border border-border shadow-xs"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 z-50"
            >
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              <DropdownMenuItem
                onSelect={() => router.push("/settings")}
                className="cursor-pointer px-2.5 py-2 text-xs text-foreground focus:bg-secondary rounded-xl flex items-center gap-2"
              >
                <Settings size={14} className="text-muted-foreground" />
                <span>Manage account</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => signOut({ redirectUrl: "/sign-in" })}
                className="cursor-pointer px-2.5 py-2 text-xs text-destructive focus:bg-destructive/10 rounded-xl flex items-center gap-2"
              >
                <LogOut size={14} className="text-destructive" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
