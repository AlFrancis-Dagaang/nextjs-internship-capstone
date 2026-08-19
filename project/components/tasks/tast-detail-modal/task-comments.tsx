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
import { getRealtimeClientId } from "@/lib/realtime/client";

type TaskCommentsProps = {
  taskId: string;
  refreshKey?: number;
  previewCount?: number;
  canEdit: boolean;
  canContribute: boolean;
  onCommentCountChanged?: (taskId: string, delta: number) => void;
  onActivityChanged?: () => void;
};

export function TaskComments({
  taskId,
  refreshKey,
  previewCount = 4,
  canEdit,
  canContribute,
  onCommentCountChanged,
  onActivityChanged,
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
    getCurrentUserId().then(setCurrentUserId);
  }, [taskId]);

  useEffect(() => {
    refresh();
  }, [taskId, refreshKey]);

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
      const result = await createComment(
        { taskId, content: submittedContent },
        getRealtimeClientId(),
      );
      if (!result.success) {
        toast({
          title: "Failed to post comment",
          description: result.fieldErrors ? "Check your input." : result.error,
          variant: "destructive",
        });
        setComments((prev) => (prev ?? []).filter((c) => c.id !== tempId));
        onCommentCountChanged?.(taskId, -1);
        setContent(submittedContent);
        setIsExpanded(true);
        return;
      }
      refresh();
      onActivityChanged?.();
    });
  }

  function handleCancel() {
    setContent("");
    setIsExpanded(false);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id, getRealtimeClientId());
      if (!result.success) {
        toast({
          title: "Failed to delete comment",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      refresh();
      onActivityChanged?.();
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
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          Comments ({comments?.length ?? 0})
        </h3>
      </div>

      {canContribute && (
        <div className="shrink-0 border border-border rounded-lg overflow-hidden bg-card focus-within:border-ring transition-colors">
          {!isExpanded ? (
            <div
              onClick={() => setIsExpanded(true)}
              className="px-3 py-2 cursor-text bg-muted/50 hover:bg-muted transition-colors"
            >
              <Input
                readOnly
                placeholder="Write a comment......"
                className="border-0 outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text text-sm bg-transparent px-0 h-8 text-muted-foreground"
              />
            </div>
          ) : (
            <div className="space-y-0">
              <div className="bg-muted border-b border-border px-2 py-1.5 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <Bold size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <Italic size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <Strikethrough size={14} />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <LinkIcon size={14} />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <List size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <ListOrdered size={14} />
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <AtSign size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
                className="min-h-20 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-none shadow-none text-sm bg-card px-3 py-2 text-card-foreground"
              />

              <div className="p-2 flex justify-end gap-2 bg-card border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-input"
                  onClick={handleCancel}
                  disabled={isPending}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
      )}

      {/* Preview List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {comments === null ? (
            <ul className="space-y-5 pb-2">
              {Array.from({ length: previewCount }).map((_, i) => (
                <CommentRowSkeleton key={i} />
              ))}
            </ul>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground shrink-0">
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
            className="shrink-0 text-xs text-primary hover:underline font-medium pt-2 text-left"
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
