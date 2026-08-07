"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTaskActivityPage } from "@/lib/actions/taskActivity";
import {
  formatRelativeTime,
  getInitials,
  formatActivityLabel,
  groupActivityByDay,
  ACTION_LABELS,
} from "@/lib/services/task-activity-helpers";
import type { ActivityWithActor } from "./task-activity-feed";

const PAGE_SIZE = 30;

export function TaskActivityModal({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<ActivityWithActor[]>([]);
  const [cursor, setCursor] = useState<{
    createdAt: string;
    id: string;
  } | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce free-text name input into the actual query value
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setNameQuery(nameInput.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nameInput]);

  async function loadPage(reset: boolean) {
    if (reset) {
      setItems([]);
      setCursor(null);
      setHasLoadedOnce(false);
    }
    setIsLoadingMore(true);
    setError(null);

    const result = await getTaskActivityPage(taskId, {
      limit: PAGE_SIZE,
      cursor: reset ? undefined : (cursor ?? undefined),
      actorName: nameQuery || undefined,
      action: actionFilter === "all" ? undefined : actionFilter,
    });

    setIsLoadingMore(false);
    setHasLoadedOnce(true);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setItems((prev) =>
      reset ? result.data.items : [...prev, ...result.data.items],
    );
    setCursor(result.data.nextCursor);
  }

  // Fresh load whenever the modal opens, or filters change while open
  useEffect(() => {
    if (!open) return;
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId, nameQuery, actionFilter]);

  // Reset filter UI when the modal closes, so reopening starts clean
  useEffect(() => {
    if (!open) {
      setNameInput("");
      setNameQuery("");
      setActionFilter("all");
    }
  }, [open]);

  const groups = useMemo(() => groupActivityByDay(items), [items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity log</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 shrink-0">
          <Input
            placeholder="Search by name..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-8 text-xs w-40 shrink-0">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All actions
              </SelectItem>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <SelectItem key={action} value={action} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-red-500 text-xs">
            Failed to load activity: {error}
          </p>
        )}

        {!hasLoadedOnce && !error && (
          <ul className="space-y-4 pr-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-6 w-6 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-2.5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasLoadedOnce && items.length === 0 && !error && (
          <p className="text-neutral-400 text-xs py-6 text-center">
            {nameQuery || actionFilter !== "all"
              ? "No matching activity."
              : "No activity yet."}
          </p>
        )}

        {items.length > 0 && (
          <div className="flex-1 overflow-y-auto pr-2 space-y-5">
            {groups.map((group) => (
              <div key={group.label} className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 sticky top-0 bg-white dark:bg-neutral-950 py-1">
                  {group.label}
                </div>
                <ul className="space-y-4">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                        {entry.actor ? getInitials(entry.actor.name) : "?"}
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-xs text-neutral-600 dark:text-neutral-300">
                          <span className="font-medium">
                            {entry.actor?.name ?? "Unknown user"}
                          </span>{" "}
                          {formatActivityLabel(entry)}
                        </span>
                        <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {cursor && (
              <div className="pt-2 pb-1 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isLoadingMore}
                  onClick={() => loadPage(false)}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={13} className="mr-1.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
