"use client";

import { Bell, Palette, Shield, User, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AppearanceTab } from "./appearance-tab";
import { NotificationsTab } from "./notifications-tab";
import { ProfileTab } from "./profile-tab";
import { SecurityTab } from "./security-tab";
import { TeamsTab } from "./teams-tab";

type SettingsTab =
  | "profile"
  | "notifications"
  | "security"
  | "appearance"
  | "teams";

type UserSchema = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type TeamForUser = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
};

type SettingsShellProps = {
  activeTab: SettingsTab;
  dbUser: UserSchema;
  teams: TeamForUser[];
};

const navItems: {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "teams", label: "Teams", icon: Users },
];

export function SettingsShell({
  activeTab,
  dbUser,
  teams,
}: SettingsShellProps) {
  const searchParams = useSearchParams();

  function createTabUrl(tabId: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    return `/settings?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12 px-2 sm:px-0">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Manage your account settings, security preferences, and team organizations."
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Card (Horizontal scrollable pill list on mobile, sidebar list on desktop) */}
        <div className="lg:col-span-1 bg-card border border-border/80 rounded-3xl shadow-xs p-3 space-y-1 overflow-x-auto scrollbar-thin">
          <div className="hidden lg:block px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Preferences
          </div>
          <nav className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={createTabUrl(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 lg:py-2 text-xs font-medium rounded-2xl lg:rounded-xl transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && <ProfileTab dbUser={dbUser} />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "teams" && (
            <TeamsTab initialTeams={teams} currentUserId={dbUser.id} />
          )}
        </div>
      </div>
    </div>
  );
}
