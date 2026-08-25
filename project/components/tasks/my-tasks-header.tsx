// components/tasks/my-tasks-header.tsx
"use client"

import { Calendar, Filter, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ProjectCalendarModal } from "@/components/projects/modals/project-calendar-modal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUiStore } from "@/stores/ui-store"
import type { CalendarTaskDTO } from "@/types"

interface MyTasksHeaderProps {
  currentUserId: string
  upcomingTasks: CalendarTaskDTO[]
}

export function MyTasksHeader({
  currentUserId,
  upcomingTasks,
}: MyTasksHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [mobileFilterModalOpen, setMobileFilterModalOpen] = useState(false)

  // Connect search and filters to the global UI store
  const searchQuery = useUiStore((s) => s.searchQuery)
  const setSearchQuery = useUiStore((s) => s.setSearchQuery)
  const filterCompleted = useUiStore((s) => s.filterCompleted)
  const setFilterCompleted = useUiStore((s) => s.setFilterCompleted)
  const filterPriority = useUiStore((s) => s.filterPriority)
  const setFilterPriority = useUiStore((s) => s.setFilterPriority)
  const filterDueDate = useUiStore((s) => s.filterDueDate)
  const setFilterDueDate = useUiStore((s) => s.setFilterDueDate)
  const clearAllFilters = useUiStore((s) => s.clearAllFilters)

  // Reset search query and filters on mount
  useEffect(() => {
    setSearchQuery("")
    clearAllFilters()
  }, [setSearchQuery, clearAllFilters])

  const isFilterActive =
    filterCompleted !== "all" ||
    filterPriority !== "all" ||
    filterDueDate !== "all"

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="View and manage tasks assigned to you across all projects"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-52 md:w-60">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-secondary/50 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* --- FILTER (Dropdown on Desktop, Dialog Modal on Mobile) --- */}
            <div className="hidden sm:block">
              <DropdownMenu
                open={filterDropdownOpen}
                onOpenChange={setFilterDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-9 text-xs bg-background border-border text-foreground rounded-xl shadow-2xs px-3 flex items-center gap-1.5 hover:bg-secondary cursor-pointer"
                  >
                    <Filter size={13} className="text-muted-foreground" />
                    <span>Filter</span>
                    {isFilterActive && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-card" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-card border border-border rounded-3xl shadow-xl p-3.5 space-y-3.5 text-left z-50"
                >
                  <FilterContent
                    filterCompleted={filterCompleted}
                    setFilterCompleted={setFilterCompleted}
                    filterPriority={filterPriority}
                    setFilterPriority={setFilterPriority}
                    filterDueDate={filterDueDate}
                    setFilterDueDate={setFilterDueDate}
                    isFilterActive={isFilterActive}
                    clearAllFilters={clearAllFilters}
                    onClose={() => setFilterDropdownOpen(false)}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Filter Trigger Button */}
            <div className="block sm:hidden flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileFilterModalOpen(true)}
                className="relative h-9 w-full sm:w-auto text-xs bg-background border-border text-foreground rounded-xl shadow-2xs px-3 flex items-center justify-center gap-1.5 hover:bg-secondary cursor-pointer"
              >
                <Filter size={13} className="text-muted-foreground" />
                <span>Filter</span>
                {isFilterActive && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-card" />
                )}
              </Button>
            </div>

            {/* Calendar Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-medium rounded-xl bg-secondary/70 hover:bg-secondary border border-border/60 text-foreground transition-colors cursor-pointer flex-1 sm:flex-none"
            >
              <Calendar size={14} />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </PageHeader>

      {/* --- MOBILE FILTER DIALOG MODAL --- */}
      <Dialog
        open={mobileFilterModalOpen}
        onOpenChange={setMobileFilterModalOpen}
      >
        <DialogContent className="bg-card border border-border/80 rounded-3xl shadow-2xl p-6 max-w-sm w-[90vw] sm:hidden">
          <DialogHeader className="space-y-1 pb-2 border-b border-border">
            <DialogTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Filter Tasks
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <FilterContent
              filterCompleted={filterCompleted}
              setFilterCompleted={setFilterCompleted}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
              filterDueDate={filterDueDate}
              setFilterDueDate={setFilterDueDate}
              isFilterActive={isFilterActive}
              clearAllFilters={clearAllFilters}
              onClose={() => setMobileFilterModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Modal Integration */}
      <ProjectCalendarModal
        open={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        projectId="my-tasks"
        projectName="My Tasks"
        upcomingTasks={upcomingTasks}
        currentUserId={currentUserId}
      />
    </>
  )
}

// --- REUSABLE FILTER SUB-COMPONENT ---
function FilterContent({
  filterCompleted,
  setFilterCompleted,
  filterPriority,
  setFilterPriority,
  filterDueDate,
  setFilterDueDate,
  isFilterActive,
  clearAllFilters,
  onClose,
}: any) {
  return (
    <div className="space-y-3.5 text-left">
      {/* Status Filter */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Status
        </label>
        <Select
          value={filterCompleted}
          onValueChange={(val: any) => setFilterCompleted(val)}
        >
          <SelectTrigger className="w-full h-9 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-card border border-border rounded-xl">
            <SelectItem value="all" className="text-xs">
              All
            </SelectItem>
            <SelectItem value="completed" className="text-xs">
              Completed
            </SelectItem>
            <SelectItem value="incomplete" className="text-xs">
              Incomplete
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Priority
        </label>
        <Select
          value={filterPriority}
          onValueChange={(val: any) => setFilterPriority(val)}
        >
          <SelectTrigger className="w-full h-9 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-card border border-border rounded-xl">
            <SelectItem value="all" className="text-xs">
              All
            </SelectItem>
            <SelectItem value="low" className="text-xs">
              Low
            </SelectItem>
            <SelectItem value="medium" className="text-xs">
              Medium
            </SelectItem>
            <SelectItem value="high" className="text-xs">
              High
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Due Date Filter */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Due date
        </label>
        <Select
          value={filterDueDate}
          onValueChange={(val: any) => setFilterDueDate(val)}
        >
          <SelectTrigger className="w-full h-9 text-xs bg-background border-input text-foreground rounded-xl shadow-none">
            <SelectValue placeholder="All due dates" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-card border border-border rounded-xl">
            <SelectItem value="all" className="text-xs">
              All
            </SelectItem>
            <SelectItem value="overdue" className="text-xs">
              Overdue
            </SelectItem>
            <SelectItem value="today" className="text-xs">
              Due today
            </SelectItem>
            <SelectItem value="this_week" className="text-xs">
              Due this week
            </SelectItem>
            <SelectItem value="none" className="text-xs">
              No due date
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFilterActive && (
        <div className="pt-2 border-t border-border flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAllFilters()
              onClose()
            }}
            className="w-full h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
