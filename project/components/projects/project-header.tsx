"use client";

import Link from "next/link";
import { ArrowLeft, Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/db/schema";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-transparent dark:bg-neutral-900 px-4 py-3 rounded-xl">
      {/* Left side: Back button + Title & Description */}
      <div className="flex items-center space-x-3 min-w-0">
        <Link
          href="/projects"
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
            {project.name}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-md">
            {project.description ?? "Sample project description"}
          </p>
        </div>
      </div>

      {/* Right side: Search, Members, and Group By controls */}
      <div className="flex items-center space-x-3 ml-auto flex-wrap">
        <div className="relative w-48 hidden sm:block">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            size={14}
          />
          <Input className="pl-8 h-8 text-xs" placeholder="Search tasks..." />
        </div>

        {/* Member Avatars */}
        <div className="hidden lg:flex items-center">
          <div className="flex -space-x-1.5 overflow-hidden">
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold">
              U1
            </div>
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-indigo-600 text-white flex items-center justify-center text-[10px] font-semibold">
              U2
            </div>
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-purple-600 text-white flex items-center justify-center text-[10px] font-semibold">
              U3
            </div>
          </div>
          <span className="ml-1.5 inline-flex items-center justify-center h-7 px-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-medium">
            +3
          </span>
        </div>

        {/* Group By selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hidden xl:inline">
            Group:
          </span>
          <Select defaultValue="none">
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
