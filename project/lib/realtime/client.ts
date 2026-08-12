"use client";

import PusherClient from "pusher-js";

let pusherClientInstance: PusherClient | null = null;

/**
 * Singleton Pusher client. Reused across every hook that subscribes to a
 * channel so we don't open a new socket per hook instance.
 */
export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! },
    );
  }
  return pusherClientInstance;
}

/**
 * Stable per-tab id, generated once per session. Passed to Server Actions
 * (see integration snippet) so the tab that made a change can ignore its
 * own echo when the board-event comes back over the channel.
 */
export function getRealtimeClientId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "pf-realtime-client-id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}
