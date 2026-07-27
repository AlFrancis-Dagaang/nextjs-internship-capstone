"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createList } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function AddListForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
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
      const result = await createList({ projectId, name });
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
      onCreated?.();
    });
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-80 flex items-center space-x-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg p-3.5 font-medium transition-colors text-sm border border-dashed border-neutral-300 dark:border-neutral-700"
      >
        <Plus size={16} />
        <span>Add another list</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-80 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 space-y-3 border border-neutral-200 dark:border-neutral-700 shadow-sm"
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter list name..."
        className="bg-white dark:bg-neutral-900 h-9"
      />
      {fieldErrors?.name && (
        <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
      )}
      <div className="flex items-center space-x-2">
        <Button
          type="submit"
          disabled={isPending || !name.trim()}
          size="sm"
          className="bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium"
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
          className="bg-white dark:bg-neutral-900"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
