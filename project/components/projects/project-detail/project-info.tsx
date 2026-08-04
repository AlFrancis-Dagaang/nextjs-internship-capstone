// components/projects/project-detail/project-info.tsx
"use client";

import { FileText, Calendar, Clock } from "lucide-react";
import type { Project } from "@/lib/db/schema";

type ProjectInfoProps = {
  project: Project;
};

export function ProjectInfo({ project }: ProjectInfoProps) {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-neutral-200 dark:border-neutral-800">
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} /> Description
        </h4>
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed min-h-[100px]">
          {project.description || "No project description provided."}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Project Metadata
        </h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
            <div className="flex items-center space-x-2.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Calendar size={15} className="text-cyan-500" />
              <span>Due Date</span>
            </div>
            <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
              {project.dueDate
                ? new Date(project.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No due date set"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
            <div className="flex items-center space-x-2.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Clock size={15} className="text-cyan-500" />
              <span>Created At</span>
            </div>
            <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
