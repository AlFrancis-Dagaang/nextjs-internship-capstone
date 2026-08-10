// components/projects/project-card.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useProjectStore } from "@/stores/project-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/db/schema";
import { updateProject } from "@/lib/actions/projects";
import { ProjectListAction } from "./project-list-action";
import { ProjectDetailModal } from "./modals/project-detail-modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, ArrowUpRight } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  email?: string;
  role: "editor" | "viewer";
};

export function ProjectCard({
  project,
  currentUserId,
  initialMembers = [],
  ownerName,
  ownerEmail,
  myRole,
}: {
  project: Project;
  currentUserId: string;
  initialMembers?: Member[];
  ownerName?: string;
  ownerEmail?: string;
  myRole?: "editor" | "viewer";
}) {
  const router = useRouter();

  const updateProjectLocal = useProjectStore((s) => s.updateProjectLocal);
  const removeProject = useProjectStore((s) => s.removeProject);

  const members = useProjectStore(
    (s) => s.membersMap[project.id] ?? initialMembers,
  );
  const setProjectMembers = useProjectStore((s) => s.setProjectMembers);
  const addMember = useProjectStore((s) => s.addMember);
  const replaceOptimisticMember = useProjectStore(
    (s) => s.replaceOptimisticMember,
  );
  const updateMemberLocal = useProjectStore((s) => s.updateMemberLocal);
  const removeMember = useProjectStore((s) => s.removeMember);

  useEffect(() => {
    setProjectMembers(project.id, initialMembers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const { toast } = useToast();
  const isOwner = project.ownerId === currentUserId;

  const [detailOpen, setDetailOpen] = useState(false);

  const avatarColors = [
    "bg-blue-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-teal-600",
    "bg-rose-600",
  ];

  // Inline rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const [isRenamePending, startRenameTransition] = useTransition();

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name === project.name) {
      setIsRenaming(false);
      setName(project.name);
      return;
    }
    const submittedName = name;
    const prevProject = project;
    setIsRenaming(false);
    updateProjectLocal({ ...project, name: submittedName });

    startRenameTransition(async () => {
      const result = await updateProject(project.id, { name: submittedName });
      if (!result.success) {
        updateProjectLocal(prevProject);
        toast({
          title: "Failed to rename project",
          description: result.error,
          variant: "destructive",
        });
        setName(project.name);
        return;
      }
      toast({ title: "Project updated", description: result.data?.name });
    });
  }

  return (
    <>
      <div className="group relative bg-white dark:bg-neutral-900/60 backdrop-blur-xl rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/[0.03] hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col justify-between space-y-4">
        {/* Main Card Link Wrapper */}
        <Link
          href={`/projects/${project.id}`}
          className="absolute inset-0 rounded-xl z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label={`Open project ${project.name}`}
        />

        {/* Content Header */}
        <div className="relative z-10 space-y-2 pointer-events-none">
          <div className="flex items-start justify-between pr-8 gap-2">
            {isRenaming ? (
              <div
                className="pointer-events-auto flex-1 mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleRenameSubmit}>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    disabled={isRenamePending}
                    className="h-8 px-2.5 text-sm font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-cyan-500"
                  />
                </form>
              </div>
            ) : (
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors tracking-tight line-clamp-1">
                {project.name}
              </h3>
            )}

            {/* Owner or Member Role Badge */}
            {!isRenaming && (
              <div className="shrink-0 pointer-events-none">
                {isOwner ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    Owner
                  </span>
                ) : myRole ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize border border-neutral-200/60 dark:border-neutral-700/60">
                    {myRole}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {project.description ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-normal">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-neutral-400 dark:text-neutral-600 italic line-clamp-1">
              No description provided
            </p>
          )}
        </div>

        {/* Footer Metadata & SaaS Actions */}
        <div className="relative z-10 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500">
          {/* Metadata stack */}
          <div className="flex items-center space-x-3">
            {project.dueDate && (
              <div className="flex items-center space-x-1.5 text-neutral-400 dark:text-neutral-500">
                <Calendar
                  size={13}
                  className="text-neutral-400 dark:text-neutral-500"
                />
                <span className="font-medium text-[11px]">
                  {new Date(project.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 text-neutral-400 dark:text-neutral-500">
              <Users
                size={13}
                className="text-neutral-400 dark:text-neutral-500"
              />
              <span className="font-medium text-[11px]">
                {members.length + 1}
              </span>
            </div>
          </div>

          {/* Avatars Stack & Hover Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1.5">
              <div
                className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-semibold ring-2 ring-white dark:ring-neutral-900 uppercase shadow-sm"
                title={`Owner: ${ownerName || ownerEmail || "Project Owner"}`}
              >
                {ownerName?.[0] ?? ownerEmail?.[0] ?? "U"}
              </div>
              {members.slice(0, 2).map((m, i) => (
                <div
                  key={m.id}
                  className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-semibold ring-2 ring-white dark:ring-neutral-900 uppercase shadow-sm ${
                    avatarColors[i % avatarColors.length]
                  }`}
                  title={`${m.email ?? "Member"} (${m.role})`}
                >
                  {m.email?.[0] ?? "U"}
                </div>
              ))}
              {members.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-neutral-900">
                  +{members.length - 2}
                </div>
              )}
            </div>

            {/* SaaS interactive navigation cue icon */}
            <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 group-hover:bg-cyan-500 group-hover:text-neutral-950 flex items-center justify-center transition-all duration-200 shadow-sm">
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>

        {/* Absolute corner action menu (isolated click layer) */}
        <div
          className="absolute top-3 right-3 z-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <ProjectListAction
            project={project}
            isOwner={isOwner}
            onViewDetails={() => setDetailOpen(true)}
            onRename={() => {
              setName(project.name);
              setIsRenaming(true);
            }}
            onDeleted={removeProject}
            onMemberAdded={addMember}
            onMemberAddConfirmed={replaceOptimisticMember}
            onMemberRemoved={removeMember}
          />
        </div>
      </div>
      <ProjectDetailModal
        project={project}
        members={members}
        isOwner={isOwner}
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onMemberAdded={addMember}
        onMemberAddConfirmed={replaceOptimisticMember}
        onMemberRoleChanged={updateMemberLocal}
        onMemberRemoved={removeMember}
      />
    </>
  );
}
