"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommentRow, type CommentWithAuthor } from "./comment-row";

export function TaskCommentsModal({
  comments,
  currentUserId,
  isPending,
  onDelete,
  open,
  onOpenChange,
}: {
  comments: CommentWithAuthor[];
  currentUserId: string | null;
  isPending: boolean;
  onDelete: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const orderedComments = [...comments].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments ({comments.length})</DialogTitle>
        </DialogHeader>

        <ul className="flex-1 overflow-y-auto space-y-5 pr-2 pb-2">
          {orderedComments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              isPending={isPending}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
