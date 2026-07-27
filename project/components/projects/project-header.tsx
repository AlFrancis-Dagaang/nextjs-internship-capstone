"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar as CalendarIcon,
  User,
} from "lucide-react";
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
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start space-x-4">
          <Link
            href="/projects"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {project.name}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              {project.description ??
                "Sample description Sample description Sample description"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-300">
            <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xs">
              AD
            </div>
            <div>
              <span className="text-xs text-neutral-400 block leading-none">
                Owner
              </span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Al Francis Daga-ang
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 rounded-md">
            <CalendarIcon size={14} className="text-neutral-400" />
            <span>Due date:</span>
            <span className="font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 px-1.5 py-0.5 rounded">
              October 31, 2026
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <Input className="pl-9 h-9" placeholder="" />
          </div>

          <div className="flex items-center">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                U1
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                U2
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                U3
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-pink-600 text-white flex items-center justify-center text-xs font-semibold">
                U4
              </div>
            </div>
            <span className="ml-2 inline-flex items-center justify-center h-8 px-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
              +3
            </span>
          </div>

          <Button variant="outline" size="sm" className="h-9">
            Add Members
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            GROUP BY:
          </span>
          <Select defaultValue="none">
            <SelectTrigger className="w-28 h-9 text-xs">
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
