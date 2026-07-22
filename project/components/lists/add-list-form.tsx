"use client";

import { useState, useTransition } from "react";
import { createList } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddListForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createList({ projectId, name });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setName("");
      setError(undefined);
      onCreated?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-outer_space-400 rounded-lg border-2 border-dashed border-french_gray-300 dark:border-paynes_gray-400 p-4 space-y-2"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New list name"
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Adding..." : "+ Add list"}
      </Button>
    </form>
  );
}
