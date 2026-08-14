"use client";

import { useEffect } from "react";
import { getPusherClient, getRealtimeClientId } from "@/lib/realtime/client";
import type { ProjectRealtimeEvent } from "@/lib/realtime/server";

/**
 * Subscribes to the same project-{projectId} channel useRealtimeBoard uses,
 * but listens for "project-event" (title/member changes) instead of
 * "board-event" — kept separate so this never touches board-store.
 */
export function useRealtimeProject(
  projectId: string,
  onEvent: (event: ProjectRealtimeEvent) => void,
) {
  useEffect(() => {
    if (!projectId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`project-${projectId}`);
    const clientId = getRealtimeClientId();

    const handler = (
      event: ProjectRealtimeEvent & { originClientId?: string },
    ) => {
      if (event.originClientId && event.originClientId === clientId) return;
      onEvent(event);
    };

    channel.bind("project-event", handler);

    return () => {
      channel.unbind("project-event", handler);
      // Note: if useRealtimeBoard is also subscribed to this same channel
      // elsewhere on the page, calling unsubscribe here is safe — Pusher
      // reference-counts subscribe/unsubscribe per channel name.
      pusher.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, onEvent]);
}
