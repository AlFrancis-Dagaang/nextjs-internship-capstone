"use client";

import { useState } from "react";
import type { Comment, User } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type CommentWithAuthor = Comment & { author: User };

const avatarColors = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-purple-500 text-white",
  "bg-rose-500 text-white",
  "bg-indigo-500 text-white",
];

export function getAvatarColor(nameOrInitials: string): string {
  const initials = getInitials(nameOrInitials);
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function getInitials(name: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatRelativeTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function CommentRow({
  comment,
  currentUserId,
  isPending,
  onDelete,
  onEdit,
}: {
  comment: CommentWithAuthor;
  currentUserId: string | null;
  isPending: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!draft.trim() || draft === comment.content) {
      setIsEditing(false);
      setDraft(comment.content);
      return;
    }
    setIsSaving(true);
    const ok = await onEdit(comment.id, draft);
    setIsSaving(false);
    if (ok) setIsEditing(false);
  }

  function handleCancel() {
    setDraft(comment.content);
    setIsEditing(false);
  }

  const authorName = comment.author?.name ?? "User";
  const stableColorKey =
    comment.author?.id || comment.author?.name || comment.id;

  return (
    <li className="flex gap-3">
      <div
        className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-medium uppercase ring-2 ring-card shrink-0 shadow-2xs ${getAvatarColor(
          stableColorKey,
        )}`}
      >
        {getInitials(authorName)}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-xs text-foreground">
            {authorName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2 border border-border/80 rounded-2xl overflow-hidden bg-card focus-within:border-ring transition-colors shadow-sm p-2">
            <Textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isSaving}
              className="min-h-16 text-xs border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-none bg-transparent shadow-none text-card-foreground"
            />
            <div className="flex justify-end gap-2 pt-1 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl shadow-2xs cursor-pointer"
                onClick={handleCancel}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
                onClick={handleSave}
                disabled={isSaving || !draft.trim()}
                type="button"
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs p-3 border border-border/80 rounded-2xl bg-card text-card-foreground whitespace-pre-wrap shadow-2xs">
            {comment.content}
          </div>
        )}

        {!isEditing && comment.authorId === currentUserId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <button
              onClick={() => setIsEditing(true)}
              className="hover:text-foreground hover:underline cursor-pointer font-medium"
            >
              Edit
            </button>
            <span>·</span>
            <button
              disabled={isPending}
              onClick={() => onDelete(comment.id)}
              className="hover:text-destructive hover:underline disabled:opacity-50 cursor-pointer font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function CommentRowSkeleton() {
  return (
    <li className="flex gap-3 animate-pulse">
      <div className="h-7 w-7 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-2 w-10 rounded bg-muted" />
        </div>
        <div className="h-12 rounded-2xl bg-muted border border-border/80" />
      </div>
    </li>
  );
}
