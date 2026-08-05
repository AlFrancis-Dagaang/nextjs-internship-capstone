// components/projects/project-header.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/db/schema";

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "editor" | "viewer";
};

export function ProjectHeader({
  project,
  members,
  ownerName,
  ownerEmail,
}: {
  project: Project;
  members: Member[];
  ownerName?: string;
  ownerEmail?: string;
}) {
  const avatarColors = [
    "bg-blue-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-teal-600",
    "bg-rose-600",
  ];

  const visibleMembers = members.slice(0, 3);
  const extraCount = members.length > 3 ? members.length - 3 : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-transparent px-0 py-0 m-0">
      {/* Left side: Back button + Title & Description */}
      <div className="flex items-center space-x-3.5 min-w-0">
        <Link
          href="/projects"
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-lg transition-all text-neutral-500 dark:text-neutral-400 shrink-0 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
          aria-label="Back to projects"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 space-y-0.5">
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate tracking-tight">
            {project.name}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-md leading-normal">
            {project.description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Right side: Search, Members, and Group By controls */}
      <div className="flex items-center space-x-3 ml-auto flex-wrap">
        <div className="relative w-48 hidden sm:block">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
            size={13}
          />
          <Input
            className="pl-8 h-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-cyan-500"
            placeholder="Search tasks..."
          />
        </div>

        {/* Member Avatars */}
        <div className="hidden lg:flex items-center">
          <div className="flex -space-x-1.5 overflow-hidden">
            <div
              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-amber-500 text-white flex items-center justify-center text-[9px] font-semibold uppercase shadow-sm leading-none text-center"
              title={`Owner: ${ownerName || ownerEmail || "Project Owner"}`}
            >
              {ownerName?.[0] ?? ownerEmail?.[0] ?? "U"}
            </div>
            {visibleMembers.map((m, i) => (
              <div
                key={m.id}
                className={`inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 text-white flex items-center justify-center text-[9px] font-semibold uppercase shadow-sm leading-none text-center ${
                  avatarColors[i % avatarColors.length]
                }`}
                title={`${m.name ?? m.email ?? "Member"} (${m.role})`}
              >
                {m.name?.[0] ?? m.email?.[0] ?? "U"}
              </div>
            ))}
          </div>
          {extraCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-medium border border-neutral-200/60 dark:border-neutral-700/60 leading-none">
              +{extraCount}
            </span>
          )}
        </div>

        {/* Group By selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 hidden xl:inline">
            Group:
          </span>
          <Select defaultValue="none">
            <SelectTrigger className="w-24 h-8 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/80 dark:border-neutral-800 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl">
              <SelectItem value="none" className="text-xs">
                None
              </SelectItem>
              <SelectItem value="status" className="text-xs">
                Status
              </SelectItem>
              <SelectItem value="priority" className="text-xs">
                Priority
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
