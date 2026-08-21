"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

export function NotificationsTab() {
  const [preferences, setPreferences] = useState({
    taskAssignments: true,
    comments: true,
    dueDates: true,
    projectInvites: true,
  });

  function togglePreference(key: keyof typeof preferences) {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-primary" />
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Notification Preferences
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose what alerts and activities you want to receive notifications
            for.
          </p>
        </div>
      </div>

      <div className="space-y-4 divide-y divide-border/60">
        <div className="flex items-center justify-between pt-4 first:pt-0">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-foreground">
              Task Assignments
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Receive alerts when you are assigned to a task.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.taskAssignments}
            onChange={() => togglePreference("taskAssignments")}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-foreground">
              Comments & Mentions
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Get notified when someone comments on your tasks.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.comments}
            onChange={() => togglePreference("comments")}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-foreground">
              Due Dates
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Receive reminders for upcoming or overdue task deadlines.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.dueDates}
            onChange={() => togglePreference("dueDates")}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-foreground">
              Project Invitations
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Be notified when you are invited to join a project.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.projectInvites}
            onChange={() => togglePreference("projectInvites")}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
