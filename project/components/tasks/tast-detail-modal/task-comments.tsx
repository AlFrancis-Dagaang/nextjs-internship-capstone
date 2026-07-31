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
  updateComment,
} from "@/lib/actions/comments";
import { getCurrentUserId } from "@/lib/actions/currentUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CommentRow,
  CommentRowSkeleton,
  type CommentWithAuthor,
} from "./task-comments/comment-row";
import { TaskCommentsModal } from "./task-comments/task-comments-modal";

type TaskCommentsProps = {
  taskId: string;
  previewCount?: number;
  onCommentCountChanged?: (taskId: string, delta: number) => void;
};

export function TaskComments({
  taskId,
  previewCount = 4,
  onCommentCountChanged,
}: TaskCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAllOpen, setShowAllOpen] = useState(false);

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

    const tempId = `temp-${crypto.randomUUID()}`;
    const submittedContent = content;
    const optimisticComment = {
      id: tempId,
      taskId,
      authorId: currentUserId ?? "",
      content: submittedContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: currentUserId ?? "", name: "You" },
    } as CommentWithAuthor;

    setContent("");
    setIsExpanded(false);
    setComments((prev) => [...(prev ?? []), optimisticComment]);
    onCommentCountChanged?.(taskId, 1);

    startTransition(async () => {
      const result = await createComment({ taskId, content: submittedContent });
      if (!result.success) {
        toast({
          title: "Failed to post comment",
          description: result.fieldErrors ? "Check your input." : result.error,
          variant: "destructive",
        });
        setComments((prev) => (prev ?? []).filter((c) => c.id !== tempId));
        onCommentCountChanged?.(taskId, -1);
        setContent(submittedContent); // give the user their text back
        setIsExpanded(true);
        return;
      }
      refresh(); // real data replaces the temp entry wholesale
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
      onCommentCountChanged?.(taskId, -1);
    });
  }

  async function handleEdit(id: string, content: string): Promise<boolean> {
    const result = await updateComment(id, content);
    if (!result.success) {
      toast({
        title: "Failed to update comment",
        description: result.error,
        variant: "destructive",
      });
      return false;
    }
    refresh();
    return true;
  }

  const preview = comments?.slice(-previewCount).reverse() ?? [];
  const hasMore = (comments?.length ?? 0) > previewCount;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Comments ({comments?.length ?? 0})
        </h3>
      </div>

      {/* Collapsible Comment Input Box with fully visible border styling */}
      <div className="shrink-0 border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-950 focus-within:border-cyan-400 dark:focus-within:border-cyan-400 transition-colors ">
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
          <div className="space-y-0">
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
              className="min-h-20 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-none shadow-none text-sm bg-white dark:bg-neutral-950 px-3 py-2"
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

      {/* Preview List - capped height, scrolls only if content exceeds it */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {comments === null ? (
            <ul className="space-y-5 pb-2">
              {Array.from({ length: previewCount }).map((_, i) => (
                <CommentRowSkeleton key={i} />
              ))}
            </ul>
          ) : comments.length === 0 ? (
            <p className="text-xs text-neutral-400 shrink-0">
              No comments yet.
            </p>
          ) : (
            <ul className="space-y-5 pb-2">
              {preview.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  currentUserId={currentUserId}
                  isPending={isPending}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </ul>
          )}
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAllOpen(true)}
            className="shrink-0 text-xs text-cyan-600 hover:text-cyan-700 hover:underline font-medium pt-2"
          >
            See all comments ({comments!.length})
          </button>
        )}
      </div>

      <TaskCommentsModal
        comments={comments ?? []}
        currentUserId={currentUserId}
        isPending={isPending}
        onDelete={handleDelete}
        onEdit={handleEdit}
        open={showAllOpen}
        onOpenChange={setShowAllOpen}
      />
    </div>
  );
}
