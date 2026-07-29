"use client";

import type { Comment, User } from "@/lib/db/schema";

export type CommentWithAuthor = Comment & { author: User };

export function formatRelativeTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  return date.toLocaleDateString();
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CommentRow({
  comment,
  currentUserId,
  isPending,
  onDelete,
}: {
  comment: CommentWithAuthor;
  currentUserId: string | null;
  isPending: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
        {getInitials(comment.author.name)}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {comment.author.name}
          </span>
          <span className="text-[10px] text-neutral-400">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        <div className="text-sm p-3 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
          {comment.content}
        </div>

        {comment.authorId === currentUserId && (
          <div className="flex items-center gap-3 text-xs text-neutral-400 px-1">
            <button className="hover:text-neutral-700 hover:underline">
              Edit
            </button>
            <span>·</span>
            <button
              disabled={isPending}
              onClick={() => onDelete(comment.id)}
              className="hover:text-red-500 hover:underline disabled:opacity-50"
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
      <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <div className="h-3.5 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-2.5 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="h-14 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />
      </div>
    </li>
  );
}
