// hooks/use-inline-rename.ts
"use client"

import { useState, useTransition } from "react"
import { useToast } from "@/hooks/use-toast"

type UseInlineRenameProps = {
  initialName: string
  onSave: (
    newName: string,
  ) => Promise<{ success: boolean; error?: string; data?: any }>
  onOptimisticUpdate?: (newName: string) => void
  onRollback?: () => void
}

export function useInlineRename({
  initialName,
  onSave,
  onOptimisticUpdate,
  onRollback,
}: UseInlineRenameProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [name, setName] = useState(initialName)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleCancel() {
    setIsRenaming(false)
    setName(initialName)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === initialName) {
      handleCancel()
      return
    }

    const submittedName = name.trim()
    setIsRenaming(false)

    onOptimisticUpdate?.(submittedName)

    startTransition(async () => {
      const result = await onSave(submittedName)
      if (!result.success) {
        onRollback?.()
        toast({
          title: "Failed to update",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        })
        setName(initialName)
        return
      }
      toast({ title: "Updated successfully", description: submittedName })
    })
  }

  return {
    isRenaming,
    setIsRenaming,
    name,
    setName,
    isPending,
    handleSubmit,
    handleCancel,
  }
}
