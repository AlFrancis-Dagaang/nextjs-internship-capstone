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
  attachTeamToProject,
  searchTeamsForProjectAttach,
} from "@/lib/actions/project-team"

type SearchTeam = {
  id: string
  name: string
  status: "available" | "attached"
}

type AttachTeamModalProps = {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttachTeamModal({
  projectId,
  open,
  onOpenChange,
}: AttachTeamModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<SearchTeam | null>(null)
  const [role, setRole] = useState<"editor" | "contributor" | "viewer">(
    "viewer",
  )
  const [isPending, startTransition] = useTransition()

  const [searchResults, setSearchResults] = useState<SearchTeam[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRequestIdRef = useRef(0)

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedTeam(null)
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
    if (trimmed.length < 1) {
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
        const result = await searchTeamsForProjectAttach(projectId, trimmed)
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

  async function handleAttach(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTeam) return

    const targetTeamId = selectedTeam.id
    const assignedRole = role

    startTransition(async () => {
      const result = await attachTeamToProject(projectId, {
        teamId: targetTeamId,
        role: assignedRole,
      })

      if (!result.success) {
        toast({
          title: "Failed to attach team",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({ title: "Team attached successfully" })
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
              Attach Team
            </DialogTitle>
          </DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAttach} className="space-y-4 pt-4">
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Search Team
            </label>
            <Input
              placeholder="Search team name..."
              value={selectedTeam ? selectedTeam.name : query}
              onChange={(e) => {
                setSelectedTeam(null)
                setQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => {
                if (!selectedTeam && query.trim().length >= 1)
                  setShowDropdown(true)
              }}
              disabled={isPending}
              className="h-9 text-xs bg-muted border-input text-foreground rounded-lg w-full focus-visible:ring-1"
            />

            {showDropdown && !selectedTeam && query.trim().length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {isLoadingSearch ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                    <Loader2
                      size={14}
                      className="animate-spin text-foreground"
                    />
                    <span>Searching teams...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No matching teams found
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                    {searchResults.map((team) => {
                      const isSelectable = team.status === "available"
                      return (
                        <div
                          key={team.id}
                          onClick={() => {
                            if (!isSelectable) return
                            setSelectedTeam(team)
                            setShowDropdown(false)
                          }}
                          className={`px-3 py-2.5 flex items-center justify-between transition-colors ${
                            isSelectable
                              ? "hover:bg-muted cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <span className="text-xs font-medium text-foreground">
                            {team.name}
                          </span>
                          {team.status === "attached" && (
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                              Attached
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
              Assign Team Role
            </label>
            <Select
              value={role}
              onValueChange={(val: "editor" | "contributor" | "viewer") =>
                setRole(val)
              }
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
              disabled={isPending || !selectedTeam}
              className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg shadow-none"
            >
              <UserPlus size={14} className="mr-1.5" />
              Attach Team
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
