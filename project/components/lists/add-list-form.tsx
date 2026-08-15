"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createList } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { List } from "@/lib/db/schema";
import { getRealtimeClientId } from "@/lib/realtime/client";

export function AddListForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: (list: List) => void;
}) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createList(
        { projectId, name },
        getRealtimeClientId(),
      );
      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        toast({
          title: "Failed to create list",
          description: result.fieldErrors
            ? "Please check the highlighted fields."
            : result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "List created", description: name });
      setName("");
      setFieldErrors(undefined);
      setIsExpanded(false);
      onCreated?.(result.data);
    });
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-80 flex items-center space-x-2 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-3.5 font-medium transition-colors text-sm border border-dashed border-border cursor-pointer"
      >
        <Plus size={16} />
        <span>Add another list</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-80 bg-card rounded-lg p-3 space-y-3 border border-border shadow-sm"
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter list name..."
        className="bg-muted border-input h-9 text-foreground"
      />
      {fieldErrors?.name && (
        <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
      )}
      <div className="flex items-center space-x-2">
        <Button
          type="submit"
          disabled={isPending || !name.trim()}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none"
        >
          {isPending ? "Adding..." : "Add list"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            setName("");
            setFieldErrors(undefined);
          }}
          className="bg-card border-input text-card-foreground hover:bg-accent"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
