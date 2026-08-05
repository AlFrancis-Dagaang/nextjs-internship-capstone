// components/projects/modals/project-detail-modal.tsx
"use client";

import { X } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectInfo } from "../project-detail/project-info";
import { ProjectMembers } from "../project-detail/project-members";

type Member = {
  id: string;
  userId: string;
  email?: string;
  role: "editor" | "viewer";
};

type ProjectDetailModalProps = {
  project: Project;
  members: Member[];
  isOwner: boolean;
  ownerName?: string;
  ownerEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersChanged: (members: Member[]) => void;
};

export function ProjectDetailModal({
  project,
  members,
  isOwner,
  ownerName,
  ownerEmail,
  open,
  onOpenChange,
  onMembersChanged,
}: ProjectDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 flex items-center justify-between">
          <div>
            <DialogHeader className="p-0 space-y-1">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {project.name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Project overview and team management
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Decoupled Layout Container */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* ProjectInfo gets a larger flex share for a wider workspace */}
          <div className="flex-[1.6] flex flex-col overflow-hidden">
            <ProjectInfo project={project} isOwner={isOwner} />
          </div>

          <ProjectMembers
            project={project}
            members={members}
            isOwner={isOwner}
            ownerName={ownerName}
            ownerEmail={ownerEmail}
            onMembersChanged={onMembersChanged}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
