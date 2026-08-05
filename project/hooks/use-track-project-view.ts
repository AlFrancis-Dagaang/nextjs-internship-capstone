"use client";

import { useEffect } from "react";

const STORAGE_KEY = "recently-viewed-projects";
const MAX_ENTRIES = 8;

type RecentEntry = { projectId: string; viewedAt: number };

export function useTrackProjectView(projectId: string) {
  useEffect(() => {
    if (!projectId) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: RecentEntry[] = raw ? JSON.parse(raw) : [];

      const withoutCurrent = existing.filter((e) => e.projectId !== projectId);
      const updated = [
        { projectId, viewedAt: Date.now() },
        ...withoutCurrent,
      ].slice(0, MAX_ENTRIES);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable (private browsing, disabled, etc.) —
      // fail silently, recently-viewed is a nice-to-have, not critical
    }
  }, [projectId]);
}

export function getRecentlyViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: RecentEntry[] = JSON.parse(raw);
    return entries
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .map((e) => e.projectId);
  } catch {
    return [];
  }
}
