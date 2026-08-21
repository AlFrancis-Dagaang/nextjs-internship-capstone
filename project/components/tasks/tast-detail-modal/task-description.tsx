"use client";

import { useState, useTransition } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  AtSign,
  Smile,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateTask } from "@/lib/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/db/schema";
import { useBoardStore } from "@/stores/board-store";

export function TaskDescription({
  task,
  canEdit,
  onChanged,
}: {
  task: Task;
  canEdit: boolean;
  onChanged?: (task: Task) => void;
}) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description ?? "");
  const [isPending, startTransition] = useTransition();
  const updateTaskLocal = useBoardStore((s) => s.updateTaskLocal);

  function handleSave() {
    const submittedDescription = description;
    setIsEditing(false);
    updateTaskLocal({ ...task, description: submittedDescription || null });

    startTransition(async () => {
      const result = await updateTask(task.id, {
        description: submittedDescription || undefined,
      });

      if (!result.success) {
        toast({
          title: "Failed to update description",
          description: result.error,
          variant: "destructive",
        });
        updateTaskLocal(task);
        setIsEditing(true);
        return;
      }

      onChanged?.(result.data);
    });
  }

  function handleCancel() {
    setDescription(task.description ?? "");
    setIsEditing(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>≡</span> Description
        </h3>
        {!isEditing && canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="border border-border/80 rounded-2xl overflow-hidden bg-card focus-within:ring-1 focus-within:ring-ring shadow-sm">
          {/* Formatting Toolbar */}
          <div className="bg-muted border-b border-border/60 px-2 py-1.5 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <Bold size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <Italic size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <Strikethrough size={13} />
            </Button>

            <div className="w-px h-4 bg-border/80 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <LinkIcon size={13} />
            </Button>

            <div className="w-px h-4 bg-border/80 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <List size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <ListOrdered size={13} />
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <AtSign size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
              type="button"
            >
              <Smile size={13} />
            </Button>
          </div>

          <Textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            className="h-32 max-h-48 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none resize-y shadow-none text-xs bg-card px-3 py-2 overflow-y-auto text-card-foreground"
          />

          <div className="p-2 flex justify-end gap-2 bg-card border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl shadow-2xs cursor-pointer"
              onClick={handleCancel}
              disabled={isPending}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
              onClick={handleSave}
              disabled={isPending}
              type="button"
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={canEdit ? () => setIsEditing(true) : undefined}
          className={`min-h-20 max-h-40 overflow-y-auto p-3 rounded-2xl bg-muted/30 border border-border/85 transition-colors whitespace-pre-wrap text-xs text-card-foreground pr-2 ${
            canEdit ? "hover:border-muted-foreground/50 cursor-pointer" : ""
          }`}
        >
          {task.description ? (
            task.description
          ) : (
            <span className="text-muted-foreground italic">
              Add a more detailed description...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
