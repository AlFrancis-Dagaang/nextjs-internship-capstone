"use client";

import { useEffect } from "react";
import { getPusherClient, getRealtimeClientId } from "@/lib/realtime/client";
import type { BoardRealtimeEvent } from "@/lib/realtime/server";
import { useBoardStore } from "@/stores/board-store";

/**
 * Subscribes to `project-{projectId}` and forwards every incoming event to
 * board-store's applyRemoteEvent (new action — see integration note below).
 * Mount this once, high in the board tree (board.tsx is the natural spot,
 * next to where board-store is already hydrated from server props).
 */
export function useRealtimeBoard(projectId: string) {
  // NEW store action — add to board-store.ts. It should reuse the same
  // reconcile shape as applyOptimisticMove/revertMoveSnapshot (#23) rather
  // than a bespoke handler per event type.
  const applyRemoteEvent = useBoardStore((s) => s.applyRemoteEvent);

  useEffect(() => {
    if (!projectId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`project-${projectId}`);
    const clientId = getRealtimeClientId();

    const handler = (
      event: BoardRealtimeEvent & { originClientId?: string },
    ) => {
      // Skip our own echo — we already applied this optimistically.
      if (event.originClientId && event.originClientId === clientId) return;
      applyRemoteEvent(event);
    };

    channel.bind("board-event", handler);

    return () => {
      channel.unbind("board-event", handler);
      pusher.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, applyRemoteEvent]);
}
