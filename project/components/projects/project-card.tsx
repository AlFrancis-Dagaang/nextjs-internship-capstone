// components/projects/project-card.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/db/schema";
import { updateProject } from "@/lib/actions/projects";
import { ProjectListAction } from "./project-list-action";
import { ProjectDetailModal } from "./modals/project-detail-modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, ArrowRight } from "lucide-react";

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
  const { toast } = useToast();
  const isOwner = project.ownerId === currentUserId;

  const [detailOpen, setDetailOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);

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
    setIsRenaming(false);

    startRenameTransition(async () => {
      const result = await updateProject(project.id, { name: submittedName });
      if (!result.success) {
        toast({
          title: "Failed to rename project",
          description: result.error,
          variant: "destructive",
        });
        setName(project.name);
        return;
      }
      toast({ title: "Project updated", description: result.data?.name });
      router.refresh();
    });
  }

  return (
    <>
      <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200 p-5 flex flex-col justify-between space-y-4">
        {/* Main Card Link Wrapper */}
        <Link
          href={`/projects/${project.id}`}
          className="absolute inset-0 rounded-2xl z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label={`Open project ${project.name}`}
        />

        {/* Content Header */}
        <div className="relative z-10 space-y-2 pointer-events-none">
          <div className="flex items-start justify-between pr-8">
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
                    className="h-8 px-2 text-sm font-semibold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus-visible:ring-1"
                  />
                </form>
              </div>
            ) : (
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                {project.name}
              </h3>
            )}

            {myRole && !isRenaming && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 capitalize pointer-events-none">
                {myRole}
              </span>
            )}
          </div>

          {project.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Footer Metadata & Preview */}
        <div className="relative z-10 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
          {/* Due date or Member count */}
          <div className="flex items-center space-x-3">
            {project.dueDate && (
              <div className="flex items-center space-x-1.5 text-neutral-400 dark:text-neutral-500">
                <Calendar size={13} />
                <span>{new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 text-neutral-400 dark:text-neutral-500">
              <Users size={13} />
              <span>{members.length + 1}</span>
            </div>
          </div>

          {/* Avatars & Hover Action Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1.5">
              <div
                className="w-5 h-5 rounded-full bg-cyan-500 text-neutral-900 flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-neutral-900"
                title="Owner"
              >
                👑
              </div>
              {members.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="w-5 h-5 rounded-full bg-neutral-600 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-neutral-900 uppercase"
                  title={`${m.email ?? "Member"} (${m.role})`}
                >
                  {m.email?.[0] ?? "U"}
                </div>
              ))}
            </div>

            {/* Subtle arrow indicator that highlights on hover */}
            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-cyan-500 group-hover:text-neutral-900 flex items-center justify-center transition-colors">
              <ArrowRight size={12} />
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
            members={members}
            onMembersChanged={setMembers}
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
        onMembersChanged={setMembers}
      />
    </>
  );
}
