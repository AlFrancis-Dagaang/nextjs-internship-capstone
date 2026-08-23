// components/tasks/tast-detail-modal/comment-row.tsx
"use client";

import { useState } from "react";
import type { Comment, User } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";

export type CommentWithAuthor = Comment & {
  author: User & {
    imageUrl?: string | null;
    image_url?: string | null;
    hasImage?: boolean | null;
    has_image?: boolean | null;
  };
};

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

  const authorName = comment.author?.name || comment.author?.email || "User";
  const stableUserId =
    comment.author?.id || comment.author?.email || comment.id;

  // Fallback safely across both camelCase and snake_case properties
  const authorImageUrl =
    comment.author?.imageUrl || comment.author?.image_url || null;
  const authorHasImage =
    comment.author?.hasImage ??
    comment.author?.has_image ??
    Boolean(authorImageUrl);

  return (
    <li className="flex gap-3">
      <UserAvatar
        userId={stableUserId}
        name={authorName}
        imageUrl={authorImageUrl}
        hasImage={Boolean(authorHasImage)}
        className="w-7 h-7 shrink-0 text-[10px]"
        title={authorName}
      />

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
