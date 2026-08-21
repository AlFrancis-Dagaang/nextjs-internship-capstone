"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Bell, Shield, Palette, Users } from "lucide-react";
import { ProfileTab } from "./profile-tab";
import { NotificationsTab } from "./notifications-tab";
import { SecurityTab } from "./security-tab";
import { AppearanceTab } from "./appearance-tab";
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
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <div className="p-5 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your account settings, security preferences, and team
          organizations.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Card */}
        <div className="md:col-span-1 bg-card border border-border/80 rounded-2xl shadow-xs p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Preferences
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={createTabUrl(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
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
        <div className="md:col-span-3">
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
