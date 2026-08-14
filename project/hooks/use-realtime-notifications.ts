"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/realtime/client";
import type { NotificationRealtimePayload } from "@/lib/realtime/server";

/**
 * Subscribes to `user-{userId}` and calls onNotification for each incoming
 * event. Replaces the notification bell's current 45s setInterval poll —
 * see the bell component swap in the Gemini prompt below.
 */
export function useRealtimeNotifications(
  userId: string | undefined,
  onNotification: (notification: NotificationRealtimePayload) => void,
) {
  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${userId}`);

    const handler = (notification: NotificationRealtimePayload) => {
      onNotification(notification);
    };

    channel.bind("notification", handler);

    return () => {
      channel.unbind("notification", handler);
      pusher.unsubscribe(`user-${userId}`);
    };
  }, [userId, onNotification]);
}
