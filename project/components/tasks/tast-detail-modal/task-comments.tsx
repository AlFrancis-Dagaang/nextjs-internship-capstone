"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  AtSign,
  Smile,
} from "lucide-react";
import {
  createComment,
  getCommentsByTask,
  deleteComment,
} from "@/lib/actions/comments";
import { getCurrentUserId } from "@/lib/actions/currentUser";
import { useToast } from "@/hooks/use-toast";
import type { Comment, User } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type CommentWithAuthor = Comment & { author: User };

function formatRelativeTime(d: Date | string) {
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type TaskCommentsProps = {
  taskId: string;
};

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    getCommentsByTask(taskId).then((result) => {
      if (!result.success) {
        toast({
          title: "Failed to load comments",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setComments(result.data as CommentWithAuthor[]);
    });
  }

  useEffect(() => {
    refresh();
    getCurrentUserId().then(setCurrentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  function handlePost() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await createComment({ taskId, content });
      if (!result.success) {
        toast({
          title: "Failed to post comment",
          description: result.fieldErrors ? "Check your input." : result.error,
          variant: "destructive",
        });
        return;
      }
      setContent("");
      setIsExpanded(false);
      refresh();
    });
  }

  function handleCancel() {
    setContent("");
    setIsExpanded(false);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id);
      if (!result.success) {
        toast({
          title: "Failed to delete comment",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      refresh();
    });
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Comments ({comments?.length ?? 0})
        </h3>
      </div>

      {/* Collapsible Comment Input Box */}
      <div className="shrink-0 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950 focus-within:ring-1 focus-within:ring-cyan-400">
        {!isExpanded ? (
          <div
            onClick={() => setIsExpanded(true)}
            className="px-3 py-2 cursor-text bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <Input
              readOnly
              placeholder="Write a comment......"
              className="border-0 outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text text-sm bg-transparent px-0 h-8 text-neutral-500"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <Bold size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <Italic size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <Strikethrough size={14} />
              </Button>

              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <LinkIcon size={14} />
              </Button>

              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <List size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <ListOrdered size={14} />
              </Button>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <AtSign size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                type="button"
              >
                <Smile size={14} />
              </Button>
            </div>

            <Textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment......"
              className="min-h-20 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-none shadow-none text-sm bg-white dark:bg-neutral-950 px-3"
            />

            <div className="p-2 flex justify-end gap-2 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCancel}
                disabled={isPending}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium"
                onClick={handlePost}
                disabled={isPending || !content.trim()}
                type="button"
              >
                {isPending ? "Posting…" : "Comment"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loading & Empty States */}
      {comments === null && (
        <p className="text-xs text-neutral-400 animate-pulse shrink-0">
          Loading comments…
        </p>
      )}
      {comments?.length === 0 && (
        <p className="text-xs text-neutral-400 shrink-0">No comments yet.</p>
      )}

      {/* Comments List - Takes remaining vertical space and handles scrolling exclusively */}
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <ul className="space-y-5 pb-2">
          {comments?.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                {getInitials(c.author.name)}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {c.author.name}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>

                <div className="text-sm p-3 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                  {c.content}
                </div>

                {c.authorId === currentUserId && (
                  <div className="flex items-center gap-3 text-xs text-neutral-400 px-1">
                    <button className="hover:text-neutral-700 hover:underline">
                      Edit
                    </button>
                    <span>·</span>
                    <button
                      disabled={isPending}
                      onClick={() => handleDelete(c.id)}
                      className="hover:text-red-500 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
