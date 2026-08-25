"use client"

import { Loader2, UserPlus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  addProjectMember,
  searchUsersForInvite,
} from "@/lib/actions/project-member"

type SearchUser = {
  id: string
  email: string
  name: string
  status: "available" | "member" | "owner"
  role?: "owner" | "admin" | "editor" | "contributor" | "viewer"
}

type AddIndividualModalProps = {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddIndividualModal({
  projectId,
  open,
  onOpenChange,
}: AddIndividualModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [role, setRole] = useState<
    "admin" | "editor" | "contributor" | "viewer"
  >("viewer")
  const [isPending, startTransition] = useTransition()

  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRequestIdRef = useRef(0)

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedUser(null)
      setRole("viewer")
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      setIsLoadingSearch(false)
      return
    }

    setIsLoadingSearch(true)
    setShowDropdown(true)
    const currentRequestId = ++searchRequestIdRef.current

    const timer = setTimeout(async () => {
      try {
        const result = await searchUsersForInvite(projectId, trimmed)
        if (currentRequestId !== searchRequestIdRef.current) return

        if (result.success) {
          setSearchResults(result.data.slice(0, 8))
        } else {
          setSearchResults([])
        }
      } catch (_err) {
        if (currentRequestId === searchRequestIdRef.current) {
          setSearchResults([])
        }
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsLoadingSearch(false)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, projectId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return

    const targetEmail = selectedUser.email
    const assignedRole = role

    startTransition(async () => {
      const result = await addProjectMember(projectId, {
        email: targetEmail,
        role: assignedRole,
      })

      if (!result.success) {
        toast({
          title: "Failed to add member",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Member added successfully",
        description: `${targetEmail} added as ${assignedRole}.`,
      })
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <DialogHeader className="p-0 space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground">
              Add Project Member
            </DialogTitle>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 pt-4">
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Search User
            </label>
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
              className="h-9 text-xs bg-muted border-input text-foreground rounded-lg w-full focus-visible:ring-1"
            />

            {showDropdown && !selectedUser && query.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {isLoadingSearch ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                    <Loader2
                      size={14}
                      className="animate-spin text-foreground"
                    />
                    <span>Searching users...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No matching users found
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
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
                          className={`px-3 py-2.5 flex items-center justify-between transition-colors ${
                            isSelectable
                              ? "hover:bg-muted cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          {user.status !== "available" && (
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                              {user.status}
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assign Role
            </label>
            <Select
              value={role}
              onValueChange={(
                val: "admin" | "editor" | "contributor" | "viewer",
              ) => setRole(val)}
            >
              <SelectTrigger className="w-full h-9 text-xs bg-muted border-input text-foreground rounded-lg shadow-none focus:ring-0">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card border border-border rounded-xl shadow-xl">
                <SelectItem value="viewer" className="text-xs">
                  Viewer (Read-only)
                </SelectItem>
                <SelectItem value="contributor" className="text-xs">
                  Contributor (Move & complete tasks)
                </SelectItem>
                <SelectItem value="editor" className="text-xs">
                  Editor (Full task/list management)
                </SelectItem>
                <SelectItem value="admin" className="text-xs">
                  Admin (Owner-equivalent)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-lg border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedUser}
              className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg shadow-none"
            >
              <UserPlus size={14} className="mr-1.5" />
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
