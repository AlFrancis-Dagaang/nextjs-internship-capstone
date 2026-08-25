// components/projects/project-list-action.tsx
"use client"

import {
  Edit2,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProjectInvite } from "@/hooks/use-project-invite"
import type { Project, ProjectMember } from "@/types"
import { DeleteProjectModal } from "./modals/delete-project-modal"
import { ProjectInviteDropdown } from "./project-invite-dropdown"

type ProjectListActionProps = {
  project: Project
  isOwner: boolean
  canManage: boolean
  onDeleted: (projectId: string) => void
  onViewDetails: () => void
  onRename: () => void
  onMemberAdded: (projectId: string, member: ProjectMember) => void
  onMemberAddConfirmed: (
    projectId: string,
    tempId: string,
    realMember: ProjectMember,
  ) => void
  onMemberRemoved: (projectId: string, memberId: string) => void
}

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
  const [isOpen, setIsOpen] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [view, setView] = useState<"menu" | "invite">("menu")
  const [deleteOpen, setDeleteOpen] = useState(false)

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
    onSuccess: () => {
      setIsOpen(false)
      setMobileSheetOpen(false)
    },
  })

  // Reset view when menus close
  useEffect(() => {
    if (!isOpen && !mobileSheetOpen) {
      const timer = setTimeout(() => {
        setView("menu")
        resetInviteState()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mobileSheetOpen])

  return (
    <>
      {/* --- DESKTOP TRIGGER & DROPDOWN --- */}
      <div className="hidden sm:block">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 bg-card border border-border rounded-3xl shadow-2xl p-2 space-y-1 text-left z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {view === "menu" ? (
              <>
                <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                  <span>Project Options</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  >
                    <X size={14} />
                  </button>
                </div>

                <DropdownMenuItem
                  onSelect={() => {
                    setIsOpen(false)
                    onViewDetails()
                  }}
                  className="cursor-pointer px-3 py-2.5 text-sm text-foreground focus:bg-muted rounded-xl flex items-center space-x-2.5"
                >
                  <ExternalLink
                    size={15}
                    className="text-muted-foreground shrink-0"
                  />
                  <span>Manage project</span>
                </DropdownMenuItem>

                {canManage && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setView("invite")
                    }}
                    className="cursor-pointer px-3 py-2.5 text-sm text-foreground focus:bg-muted rounded-xl flex items-center space-x-2.5"
                  >
                    <UserPlus
                      size={15}
                      className="text-muted-foreground shrink-0"
                    />
                    <span>Add members</span>
                  </DropdownMenuItem>
                )}

                {canManage && (
                  <>
                    <div className="pt-1.5 pb-1 border-t border-border mt-1">
                      <DropdownMenuItem
                        onSelect={() => {
                          setIsOpen(false)
                          onRename()
                        }}
                        className="cursor-pointer px-3 py-2.5 text-sm text-foreground focus:bg-muted rounded-xl flex items-center space-x-2.5"
                      >
                        <Edit2
                          size={15}
                          className="text-muted-foreground shrink-0"
                        />
                        <span>Rename project</span>
                      </DropdownMenuItem>
                    </div>

                    <div className="border-t border-border pt-1 mt-1">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setIsOpen(false)
                          setDeleteOpen(true)
                        }}
                        className="cursor-pointer px-3 py-2.5 text-sm text-destructive focus:bg-destructive/10 rounded-xl flex items-center space-x-2.5"
                      >
                        <Trash2
                          size={15}
                          className="text-destructive shrink-0"
                        />
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
      </div>

      {/* --- MOBILE TRIGGER & BOTTOM ACTION SHEET --- */}
      <div className="block sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            setMobileSheetOpen(true)
          }}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <MoreHorizontal size={16} />
        </Button>

        {mobileSheetOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
            onClick={(e) => {
              e.stopPropagation()
              setMobileSheetOpen(false)
            }}
          >
            <div
              className="w-full bg-card border-t border-border rounded-t-3xl shadow-2xl p-5 space-y-3 animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Handle Bar */}
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-1" />

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Project Options
                </span>
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {view === "menu" ? (
                <div className="py-1 space-y-1.5">
                  <button
                    onClick={() => {
                      setMobileSheetOpen(false)
                      onViewDetails()
                    }}
                    className="w-full text-left px-3.5 py-3 text-sm font-semibold text-foreground hover:bg-muted rounded-2xl flex items-center space-x-3.5 cursor-pointer transition-colors"
                  >
                    <ExternalLink
                      size={18}
                      className="text-muted-foreground shrink-0"
                    />
                    <span>Manage project</span>
                  </button>

                  {canManage && (
                    <button
                      onClick={() => setView("invite")}
                      className="w-full text-left px-3.5 py-3 text-sm font-semibold text-foreground hover:bg-muted rounded-2xl flex items-center space-x-3.5 cursor-pointer transition-colors"
                    >
                      <UserPlus
                        size={18}
                        className="text-muted-foreground shrink-0"
                      />
                      <span>Add members</span>
                    </button>
                  )}

                  {canManage && (
                    <>
                      <button
                        onClick={() => {
                          setMobileSheetOpen(false)
                          onRename()
                        }}
                        className="w-full text-left px-3.5 py-3 text-sm font-semibold text-foreground hover:bg-muted rounded-2xl flex items-center space-x-3.5 cursor-pointer transition-colors"
                      >
                        <Edit2
                          size={18}
                          className="text-muted-foreground shrink-0"
                        />
                        <span>Rename project</span>
                      </button>

                      <div className="pt-1.5 border-t border-border">
                        <button
                          onClick={() => {
                            setMobileSheetOpen(false)
                            setDeleteOpen(true)
                          }}
                          className="w-full text-left px-3.5 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-2xl flex items-center space-x-3.5 cursor-pointer transition-colors"
                        >
                          <Trash2
                            size={18}
                            className="text-destructive shrink-0"
                          />
                          <span>Delete project</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <ProjectInviteDropdown
                    onBack={() => setView("menu")}
                    onClose={() => setMobileSheetOpen(false)}
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteProjectModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={(id) => onDeleted(id)}
        projectId={project.id}
        projectName={project.name}
      />
    </>
  )
}
