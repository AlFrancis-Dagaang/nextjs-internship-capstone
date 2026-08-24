// components/projects/modals/project-detail-modal.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { X, Pencil, Info, Users } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProjectInfo } from "../project-detail/project-info";
import { ProjectMembers } from "../project-detail/project-members";
import { useInlineRename } from "@/hooks/use-inline-rename";
import { updateProject } from "@/lib/actions/projects";
import type { Member } from "@/stores/project-store";

type ProjectDetailModalProps = {
  project: Project;
  members: Member[];
  isOwner: boolean;
  canManage: boolean;
  ownerName?: string;
  ownerEmail?: string;
  ownerImageUrl?: string | null;
  ownerHasImage?: boolean | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: (projectId: string, member: Member) => void;
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: Member,
  ) => void;
  onMemberRoleChanged: (projectId: string, member: Member) => void;
  onMemberRemoved: (projectId: string, memberId: string) => void;
  onProjectUpdated?: (updatedProject: Project) => void;
};

export function ProjectDetailModal({
  project,
  members,
  isOwner,
  canManage,
  ownerName,
  ownerEmail,
  ownerImageUrl,
  ownerHasImage,
  open,
  onOpenChange,
  onMemberAdded,
  onMemberAddConfirmed,
  onMemberRoleChanged,
  onMemberRemoved,
  onProjectUpdated,
}: ProjectDetailModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");

  const {
    isRenaming: isEditing,
    setIsRenaming: setIsEditing,
    name: title,
    setName: setTitle,
    isPending,
    handleSubmit: handleSave,
    handleCancel,
  } = useInlineRename({
    initialName: project.name,
    onSave: async (newName) => {
      const result = await updateProject(project.id, { name: newName });
      if (result.success && result.data) {
        onProjectUpdated?.(result.data);
      }
      return result;
    },
    onOptimisticUpdate: (newName) => {
      const updated = { ...project, name: newName, updatedAt: new Date() };
      onProjectUpdated?.(updated);
    },
    onRollback: () => {
      onProjectUpdated?.(project);
    },
  });

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        const input = inputRef.current;
        if (input) {
          input.focus();
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  // Reset tab selection when modal opens/closes
  useEffect(() => {
    if (open) setActiveTab("info");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] bg-card border border-border rounded-3xl shadow-2xl p-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border shrink-0 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
            {isEditing ? (
              <form
                onSubmit={handleSave}
                className="relative flex items-center w-full max-w-md"
              >
                <Input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleCancel();
                  }}
                  disabled={isPending}
                  className="w-full bg-card text-sm sm:text-base font-semibold tracking-tight border border-border focus:outline-none focus:ring-1 focus:ring-ring rounded-xl pl-2.5 pr-9 py-1 text-foreground shadow-2xs h-auto"
                />
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all p-1 rounded-lg flex items-center justify-center cursor-pointer"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group min-w-0">
                <DialogHeader className="p-0 space-y-0">
                  <DialogTitle
                    onClick={canManage ? () => setIsEditing(true) : undefined}
                    className={`text-base sm:text-lg font-semibold tracking-tight transition-colors truncate ${
                      canManage
                        ? "cursor-pointer hover:text-primary"
                        : "text-foreground"
                    }`}
                    title={canManage ? "Click to edit title" : undefined}
                  >
                    {project.name}
                  </DialogTitle>
                </DialogHeader>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer"
                    title="Edit title"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Tab Switcher Bar (Visible only on Mobile) */}
        <div className="flex md:hidden border-b border-border bg-muted/20 px-4 py-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Info size={14} />
            <span>Project Info</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "members"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Users size={14} />
            <span>Team Members ({members.length + 1})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        {/* Desktop View: Side-by-Side Flex */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <div className="flex-[1.6] flex flex-col overflow-hidden">
            <ProjectInfo
              project={project}
              isOwner={isOwner}
              canManage={canManage}
              onProjectChanged={onProjectUpdated}
            />
          </div>
          <div className="w-120 shrink-0 flex flex-col">
            <ProjectMembers
              project={project}
              members={members}
              isOwner={isOwner}
              canManage={canManage}
              ownerName={ownerName}
              ownerEmail={ownerEmail}
              ownerImageUrl={ownerImageUrl}
              ownerHasImage={ownerHasImage}
              onMemberAdded={onMemberAdded}
              onMemberAddConfirmed={onMemberAddConfirmed}
              onMemberRoleChanged={onMemberRoleChanged}
              onMemberRemoved={onMemberRemoved}
            />
          </div>
        </div>

        {/* Mobile View: Tabbed Layout */}
        <div className="flex md:hidden flex-1 overflow-y-auto">
          {activeTab === "info" ? (
            <div className="w-full flex flex-col">
              <ProjectInfo
                project={project}
                isOwner={isOwner}
                canManage={canManage}
                onProjectChanged={onProjectUpdated}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <ProjectMembers
                project={project}
                members={members}
                isOwner={isOwner}
                canManage={canManage}
                ownerName={ownerName}
                ownerEmail={ownerEmail}
                ownerImageUrl={ownerImageUrl}
                ownerHasImage={ownerHasImage}
                onMemberAdded={onMemberAdded}
                onMemberAddConfirmed={onMemberAddConfirmed}
                onMemberRoleChanged={onMemberRoleChanged}
                onMemberRemoved={onMemberRemoved}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
