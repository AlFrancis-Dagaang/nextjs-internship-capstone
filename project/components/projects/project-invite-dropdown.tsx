// components/projects/invite/project-invite-dropdown.tsx
"use client"

import { ChevronLeft, Loader2, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserAvatar } from "@/components/ui/user-avatar"
import type { ProjectMemberRole } from "@/types"

type ProjectInviteDropdownProps = {
  onBack: () => void
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  selectedUser: any
  setSelectedUser: (user: any) => void
  inviteRole: ProjectMemberRole
  setInviteRole: (role: ProjectMemberRole) => void
  searchResults: any[]
  isLoadingSearch: boolean
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
  dropdownRef: React.RefObject<HTMLDivElement | null>
  isPending: boolean
  handleAddMember: (e: React.FormEvent) => void
}

export function ProjectInviteDropdown({
  onBack,
  onClose,
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
}: ProjectInviteDropdownProps) {
  return (
    <div className="p-1 space-y-3">
      <div className="flex items-center justify-between px-1.5 py-1 border-b border-border">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground p-0.5 flex items-center gap-1 text-xs font-semibold"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-0.5"
        >
          <X size={14} />
        </button>
      </div>

      <form onSubmit={handleAddMember} className="space-y-2.5 px-1 pt-1">
        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Add Members
        </span>

        <div className="space-y-1 relative" ref={dropdownRef}>
          <Input
            placeholder="Search by name or email..."
            value={selectedUser ? selectedUser.email : query}
            onChange={(e) => {
              setSelectedUser(null)
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => {
              if (!selectedUser && query.trim().length >= 2)
                setShowDropdown(true)
            }}
            disabled={isPending}
            className="h-8 text-xs bg-muted border-input text-foreground rounded-lg w-full focus-visible:ring-1"
          />

          {showDropdown && !selectedUser && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
              {isLoadingSearch ? (
                <div className="flex items-center justify-center py-3 text-xs text-muted-foreground gap-1.5">
                  <Loader2 size={13} className="animate-spin text-foreground" />
                  <span>Searching...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">
                  No matching users
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-border">
                  {searchResults.map((user) => {
                    const isSelectable = user.status === "available"
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (!isSelectable) return
                          setSelectedUser(user)
                          setShowDropdown(false)
                        }}
                        className={`px-2.5 py-2 flex items-center justify-between transition-colors ${
                          isSelectable
                            ? "hover:bg-muted cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <UserAvatar
                            userId={user.id || user.email}
                            name={user.name || user.email}
                            imageUrl={user.imageUrl}
                            hasImage={Boolean(user.hasImage)}
                            className="w-6 h-6 text-[10px]"
                          />
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-medium text-foreground truncate">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>

                        {user.status === "owner" && (
                          <span className="text-[9px] font-semibold text-foreground uppercase shrink-0">
                            Owner
                          </span>
                        )}
                        {user.status === "member" && (
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase shrink-0">
                            Added
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <Select
          value={inviteRole}
          onValueChange={(val: ProjectMemberRole) => setInviteRole(val)}
        >
          <SelectTrigger className="w-full h-8 text-xs bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
            <SelectItem value="viewer" className="text-xs">
              Viewer (View-only)
            </SelectItem>
            <SelectItem value="contributor" className="text-xs">
              Contributor (Move & complete tasks)
            </SelectItem>
            <SelectItem value="editor" className="text-xs">
              Editor (Manage tasks)
            </SelectItem>
            <SelectItem value="admin" className="text-xs">
              Admin (Owner-equivalent)
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="submit"
          disabled={isPending || !selectedUser}
          className="w-full h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs shadow-none rounded-lg"
        >
          <UserPlus size={13} className="mr-1.5" /> Add Member
        </Button>
      </form>
    </div>
  )
}
