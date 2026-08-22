"use client";

import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  UserPlus,
} from "lucide-react";
import type { Project, ProjectMember } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectModal } from "./modals/delete-project-modal";
import { ProjectInviteDropdown } from "./project-invite-dropdown";
import { useProjectInvite } from "@/hooks/use-project-invite";

type ProjectListActionProps = {
  project: Project;
  isOwner: boolean;
  canManage: boolean;
  onDeleted: (projectId: string) => void;
  onViewDetails: () => void;
  onRename: () => void;
  onMemberAdded: (projectId: string, member: ProjectMember) => void;
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: ProjectMember,
  ) => void;
  onMemberRemoved: (projectId: string, memberId: string) => void;
};

export function ProjectListAction({
  project,
  isOwner,
  canManage,
  onDeleted,
  onViewDetails,
  onRename,
  onMemberAdded,
  onMemberAddConfirmed,
  onMemberRemoved,
}: ProjectListActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "invite">("menu");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    query,
    setQuery,
    selectedUser,
    setSelectedUser,
    inviteRole,
    setInviteRole,
    searchResults,
    isLoadingSearch,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    isPending,
    handleAddMember,
    resetInviteState,
  } = useProjectInvite({
    projectId: project.id,
    onMemberAdded,
    onMemberAddConfirmed,
    onMemberRemoved,
    onSuccess: () => setIsOpen(false),
  });

  // Reset view when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView("menu");
        resetInviteState();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 bg-card border border-border rounded-3xl shadow-2xl p-2 space-y-1 text-left z-50"
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            const target = e.target as Element;
            if (target.closest?.("[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
        >
          {view === "menu" ? (
            <>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                <span>Project Options</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>

              <DropdownMenuItem
                onSelect={() => {
                  setIsOpen(false);
                  onViewDetails();
                }}
                className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-xl flex items-center space-x-2.5"
              >
                <ExternalLink size={15} className="text-muted-foreground" />
                <span>Manage project</span>
              </DropdownMenuItem>

              {canManage && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setView("invite");
                  }}
                  className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-xl flex items-center space-x-2.5"
                >
                  <UserPlus size={15} className="text-muted-foreground" />
                  <span>Add members</span>
                </DropdownMenuItem>
              )}

              {canManage && (
                <>
                  <div className="pt-1.5 pb-1 border-t border-border mt-1">
                    <DropdownMenuItem
                      onSelect={() => {
                        setIsOpen(false);
                        onRename();
                      }}
                      className="cursor-pointer px-2.5 py-2 text-sm text-foreground focus:bg-muted rounded-xl flex items-center space-x-2.5"
                    >
                      <Edit2 size={15} className="text-muted-foreground" />
                      <span>Rename project</span>
                    </DropdownMenuItem>
                  </div>

                  <div className="border-t border-border pt-1 mt-1">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="cursor-pointer px-2.5 py-2 text-sm text-destructive focus:bg-destructive/10 rounded-xl flex items-center space-x-2.5"
                    >
                      <Trash2 size={15} className="text-destructive" />
                      <span>Delete project</span>
                    </DropdownMenuItem>
                  </div>
                </>
              )}
            </>
          ) : (
            <ProjectInviteDropdown
              onBack={() => setView("menu")}
              onClose={() => setIsOpen(false)}
              query={query}
              setQuery={setQuery}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              inviteRole={inviteRole}
              setInviteRole={setInviteRole}
              searchResults={searchResults}
              isLoadingSearch={isLoadingSearch}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              dropdownRef={dropdownRef}
              isPending={isPending}
              handleAddMember={handleAddMember}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteProjectModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={(id) => onDeleted(id)}
        projectId={project.id}
        projectName={project.name}
      />
    </>
  );
}
