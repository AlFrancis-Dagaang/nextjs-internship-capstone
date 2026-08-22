"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Bell, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationType } from "@/lib/db/schema";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/services/notification-preferences";
import { updateNotificationPreferences } from "@/lib/actions/notification-preferences";

interface NotificationsTabProps {
  initialPreferences?: Record<NotificationType, boolean>;
}

const NOTIFICATION_DESCRIPTIONS: Record<NotificationType, string> = {
  project_added: "Receive alerts when you are added to a project.",
  project_removed: "Get notified when you are removed from a project.",
  task_assigned: "Receive alerts when you are assigned to a new task.",
  task_unassigned: "Get notified when you are removed from a task.",
  task_comment_added: "Get notified when someone comments on your tasks.",
  task_moved: "Alerts when a task is moved to a different list or section.",
  task_archived: "Get notified when a task you are involved in is archived.",
  task_due_soon_24h: "Reminder when a task is due within 24 hours.",
  task_due_soon_today: "Reminder when a task is due today.",
  project_event_added: "Alerts when a new event is added to a project.",
  team_member_added: "Get notified when a new member joins your team.",
  team_member_removed: "Alerts when a member is removed from your team.",
  team_attached_to_project:
    "Get notified when a team is attached to a project.",
};

export function NotificationsTab({
  initialPreferences,
}: NotificationsTabProps) {
  const notificationEntries = Object.keys(
    NOTIFICATION_TYPE_LABELS,
  ) as NotificationType[];

  const [preferences, setPreferences] = useState<
    Record<NotificationType, boolean>
  >(() => {
    const defaults: Record<string, boolean> = {};
    for (const type of notificationEntries) {
      defaults[type] = initialPreferences?.[type] ?? true;
    }
    return defaults as Record<NotificationType, boolean>;
  });

  const [isNotificationsOn, setIsNotificationsOn] = useState<boolean>(() => {
    if (!initialPreferences) return true;
    return Object.values(initialPreferences).some(Boolean);
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Local-only toggle while inside customization view
  function handleLocalToggle(type: NotificationType, newValue: boolean) {
    setPreferences((prev) => ({ ...prev, [type]: newValue }));
  }

  // Master toggle switch handler
  async function handleMasterToggle() {
    const newValue = !isNotificationsOn;
    setIsNotificationsOn(newValue);

    const patch = notificationEntries.reduce(
      (acc, key) => {
        acc[key] = newValue ? (preferences[key] ?? true) : false;
        return acc;
      },
      {} as Record<NotificationType, boolean>,
    );

    if (newValue) {
      setPreferences(patch);
    }

    try {
      const result = await updateNotificationPreferences(patch);
      if (!result.success) {
        throw new Error(
          result.error || "Failed to update notification settings",
        );
      }
      toast({
        title: "Preferences updated",
        description: newValue
          ? "Notifications enabled."
          : "All notifications disabled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Save button handler to batch-save current custom preferences
  async function handleSaveCustomizations() {
    setIsSaving(true);
    try {
      const result = await updateNotificationPreferences(preferences);
      if (!result.success) {
        throw new Error(result.error || "Failed to save preferences");
      }
      toast({
        title: "Preferences saved",
        description: "Your custom notification settings have been updated.",
      });
      setIsCustomizing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-6">
      {!isCustomizing ? (
        /* --- MAIN VIEW (Master Toggle Switch & Customize Trigger) --- */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Notification Preferences
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose what alerts and activities you want to receive
                  notifications for.
                </p>
              </div>
            </div>

            {/* Custom Pill Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-foreground">
                Notifications
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isNotificationsOn}
                onClick={handleMasterToggle}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isNotificationsOn ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isNotificationsOn ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60">
            <button
              type="button"
              disabled={!isNotificationsOn}
              onClick={() => setIsCustomizing(true)}
              className="group inline-flex items-center gap-2 text-xs font-semibold text-primary hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Customize my notifications</span>
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
            {!isNotificationsOn && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Enable notifications above to unlock customization options.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* --- CUSTOMIZATION VIEW (Back Button + Two-Column Grid + Save Button) --- */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsCustomizing(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to main settings
            </button>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Customize Notifications
            </h2>
          </div>

          {/* Two-Column Grid of Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {notificationEntries.map((type) => (
              <div
                key={type}
                className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/80 bg-muted/30 shadow-2xs"
              >
                <div className="space-y-0.5 pr-2">
                  <Label className="text-xs font-semibold text-foreground">
                    {NOTIFICATION_TYPE_LABELS[type]}
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {NOTIFICATION_DESCRIPTIONS[type] ||
                      "Receive notifications for this activity."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences?.[type] ?? false}
                  onChange={(e) => handleLocalToggle(type, e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveCustomizations}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
