"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CommentRow, type CommentWithAuthor } from "./comment-row";

export function TaskCommentsModal({
  comments,
  currentUserId,
  isPending,
  onDelete,
  onEdit,
  open,
  onOpenChange,
}: {
  comments: CommentWithAuthor[];
  currentUserId: string | null;
  isPending: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [nameQuery, setNameQuery] = useState("");

  const orderedComments = useMemo(() => [...comments].reverse(), [comments]);

  const filteredComments = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return orderedComments;
    return orderedComments.filter((c) =>
      c.author.name.toLowerCase().includes(q),
    );
  }, [orderedComments, nameQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments ({comments.length})</DialogTitle>
        </DialogHeader>

        {comments.length > 0 && (
          <Input
            placeholder="Search by name..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="h-8 text-xs shrink-0"
          />
        )}

        {filteredComments.length === 0 ? (
          <p className="text-neutral-400 text-xs py-6 text-center">
            {comments.length === 0
              ? "No comments yet."
              : "No matching comments."}
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto space-y-5 pr-2 pb-2">
            {filteredComments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                currentUserId={currentUserId}
                isPending={isPending}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
