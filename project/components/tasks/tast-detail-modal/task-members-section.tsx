"use client";

import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TaskMembersSection() {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
        Assign members to this task
      </Label>
      <div className="flex items-center gap-2">
        {/* Placeholder Avatars */}
        <div className="flex -space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-medium text-blue-700">
            JD
          </div>
          <div className="h-8 w-8 rounded-full bg-purple-100 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-medium text-purple-700">
            AM
          </div>
        </div>

        {/* Disabled Add Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-dashed"
          disabled
          title="Member assignment coming soon"
        >
          <Plus size={14} className="text-neutral-400" />
        </Button>
      </div>
    </div>
  );
}
