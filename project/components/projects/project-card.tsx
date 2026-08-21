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
import { Users, Calendar, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { getCompletionLabel } from "@/lib/utils/utils";

type Member = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
};

type CompletionInfo = {
  total: number;
  completed: number;
};

export function ProjectCard({
  project,
  currentUserId,
  initialMembers = [],
  ownerName,
  ownerEmail,
  myRole,
  completion,
}: {
  project: Project;
  currentUserId: string;
  initialMembers?: Member[];
  ownerName?: string;
  ownerEmail?: string;
  myRole?: "owner" | "admin" | "editor" | "contributor" | "viewer";
  completion: CompletionInfo;
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
  const canManage = isOwner || myRole === "admin";

  const [detailOpen, setDetailOpen] = useState(false);

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

  const ownerDisplayString = ownerName || ownerEmail || "Project Owner";
  const completionLabel = getCompletionLabel(
    completion.total,
    completion.completed,
  );
  const completionPercent =
    completion.total > 0
      ? Math.round((completion.completed / completion.total) * 100)
      : 0;

  return (
    <>
      <div className="group relative bg-card backdrop-blur-xl rounded-2xl border border-border/80 hover:border-ring hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xs">
        {/* Main Card Link Wrapper */}
        <Link
          href={`/projects/${project.id}`}
          className="absolute inset-0 rounded-2xl z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="h-8 px-2.5 text-xs font-medium bg-card border border-border rounded-xl shadow-2xs focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                </form>
              </div>
            ) : (
              <h3 className="text-xs font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </h3>
            )}

            {/* Owner or Member Role Badge */}
            {!isRenaming && (
              <div className="shrink-0 pointer-events-none">
                {isOwner ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                    Owner
                  </span>
                ) : myRole ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground capitalize border border-border/60">
                    {myRole}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {project.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic line-clamp-1">
              No description provided
            </p>
          )}
        </div>

        {/* Footer Metadata & SaaS Actions */}
        <div className="relative z-10 pt-3 border-t border-border/80 flex flex-col gap-3">
          {/* Owner Info Row */}
          <div className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold uppercase shadow-2xs ${getAvatarColor(
                project.ownerId || ownerDisplayString,
              )}`}
            >
              {getInitials(ownerName || ownerEmail || "U")}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Owner:{" "}
              <span className="font-medium text-foreground">
                {isOwner ? "You" : ownerDisplayString}
              </span>
            </span>
          </div>

          {/* Full-width completion section */}
          <div className="flex flex-col space-y-1.5 w-full">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1.5 text-muted-foreground">
                <CheckCircle2 size={13} className="text-muted-foreground" />
                <span className="font-medium text-[11px] text-muted-foreground">
                  Task Completion
                </span>
              </div>
              <span className="font-medium text-[11px] text-foreground">
                {completionLabel}
              </span>
            </div>
            {completion.total > 0 && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* Metadata stack */}
            <div className="flex items-center space-x-3">
              {project.dueDate && (
                <div className="flex items-center space-x-1.5 text-muted-foreground">
                  <Calendar size={13} className="text-muted-foreground" />
                  <span className="font-medium text-[11px]">
                    {new Date(project.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-1.5 text-muted-foreground">
                <Users size={13} className="text-muted-foreground" />
                <span className="font-medium text-[11px]">
                  {members.length + 1}
                </span>
              </div>
            </div>

            {/* Unified Colored Avatar Stack */}
            <div className="flex items-center">
              <div className="flex items-center -space-x-1.5">
                {members.slice(0, 3).map((m) => {
                  const stableKey = m.userId || m.email || m.id;
                  return (
                    <div
                      key={m.id}
                      className={`w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold uppercase shadow-2xs ${getAvatarColor(
                        stableKey,
                      )}`}
                      title={`${m.name ?? m.email ?? "Member"} (${m.role})`}
                    >
                      {getInitials(m.name || m.email || "U")}
                    </div>
                  );
                })}
                {members.length > 3 && (
                  <div
                    className="w-7 h-7 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shadow-2xs"
                    title={`+${members.length - 3} more members`}
                  >
                    +{members.length - 3}
                  </div>
                )}
              </div>

              {/* SaaS interactive navigation cue icon */}
              <div className="ml-3 w-6 h-6 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-200 shadow-2xs">
                <ArrowUpRight size={13} />
              </div>
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
            canManage={canManage}
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
        canManage={canManage}
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
