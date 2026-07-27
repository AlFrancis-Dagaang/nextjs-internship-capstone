"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createComment,
  getCommentsByTask,
  deleteComment,
} from "@/lib/actions/comments";
import { getCurrentUserId } from "@/lib/actions/currentUser";
import { useToast } from "@/hooks/use-toast";
import type { Comment } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TaskCommentsProps = {
  taskId: string;
};

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
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
      setComments(result.data);
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
      refresh();
    });
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
    <div className="space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Comments</p>

      {comments === null && (
        <p className="text-xs text-muted-foreground">Loading…</p>
      )}
      {comments?.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}

      <ul className="space-y-2">
        {comments?.map((c) => (
          <li key={c.id} className="text-sm border rounded p-2">
            <p>{c.content}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleString()}
              </span>
              {c.authorId === currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment…"
        />
        <Button onClick={handlePost} disabled={isPending || !content.trim()}>
          {isPending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </div>
  );
}
