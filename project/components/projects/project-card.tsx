"use client";

import { ArrowUpRight, Calendar, CheckCircle2, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useInlineRename } from "@/hooks/use-inline-rename";
import { updateProject } from "@/lib/actions/projects";
import { useProjectStore } from "@/stores/project-store";
import type {
  CompletionInfo,
  MemberRole,
  Project,
  ProjectMember,
} from "@/types";
import { UserAvatar } from "../ui/user-avatar";
import { ProjectDetailModal } from "./modals/project-detail-modal";
import { ProjectListAction } from "./project-list-action";
import { ProjectMemberStack } from "./project-member-stack";

type ProjectCardProps = {
  project: Project;
  currentUserId: string;
  initialMembers?: ProjectMember[];
  ownerName?: string;
  ownerEmail?: string;
  ownerImageUrl?: string | null;
  ownerHasImage?: boolean | null;
  myRole?: MemberRole;
  completion: CompletionInfo;
};

export function ProjectCard({
  project,
  currentUserId,
  initialMembers = [],
  ownerName,
  ownerEmail,
  ownerImageUrl,
  ownerHasImage,
  myRole,
  completion,
}: ProjectCardProps) {
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

  const isOwner = project.ownerId === currentUserId;
  const canManage = isOwner || myRole === "admin";
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    isRenaming,
    setIsRenaming,
    name,
    setName,
    isPending: isRenamePending,
    handleSubmit: handleRenameSubmit,
    handleCancel, // <--- Add this here
  } = useInlineRename({
    initialName: project.name,
    onSave: (newName) => updateProject(project.id, { name: newName }),
    onOptimisticUpdate: (newName) =>
      updateProjectLocal({ ...project, name: newName }),
    onRollback: () => updateProjectLocal(project),
  });
  const ownerDisplayString = ownerName || ownerEmail || "Project Owner";
  const completionPercent =
    completion.total > 0
      ? Math.round((completion.completed / completion.total) * 100)
      : 0;

  // Inside the component function:
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      // A tiny timeout guarantees the DOM node is fully painted before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length,
        );
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isRenaming]);
  return (
    <>
      <div className="group relative bg-card backdrop-blur-xl rounded-3xl border border-border/85 hover:border-ring hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xs">
        {/* Main Card Link Wrapper */}
        <Link
          href={`/projects/${project.id}`}
          className="absolute inset-0 rounded-3xl z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <form
                  onSubmit={handleRenameSubmit}
                  className="relative flex items-center w-full"
                >
                  <Input
                    ref={inputRef} // <--- This forces the blinking cursor to appear
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") handleCancel();
                    }}
                    disabled={isRenamePending}
                    className="h-8 pl-2.5 pr-8 text-xs font-medium bg-card border border-border rounded-xl shadow-2xs focus-visible:ring-1 focus-visible:ring-ring text-foreground w-full"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all p-1 rounded-lg flex items-center justify-center"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </form>
              </div>
            ) : (
              <h3 className="text-xs font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </h3>
            )}
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
          <div className="flex items-center gap-2">
            <UserAvatar
              userId={project.ownerId || ownerEmail || "owner"}
              name={ownerName || ownerEmail || "Project Owner"}
              imageUrl={ownerImageUrl}
              hasImage={Boolean(ownerHasImage)}
              className="w-5 h-5 text-[9px]"
            />
            <span className="text-[11px] text-muted-foreground">
              Owner:{" "}
              <span className="font-medium text-foreground">
                {isOwner ? "You" : ownerDisplayString}
              </span>
            </span>
          </div>

          <div className="flex flex-col space-y-1.5 w-full">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1.5 text-muted-foreground">
                <CheckCircle2 size={13} className="text-muted-foreground" />
                <span className="font-medium text-[11px] text-muted-foreground">
                  Tasks ({completion.total})
                </span>
              </div>
              <span className="font-medium text-[11px] text-foreground">
                {completionPercent}% completed
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

            <div className="flex items-center">
              <ProjectMemberStack members={members} />
              <div className="ml-3 w-6 h-6 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-200 shadow-2xs">
                <ArrowUpRight size={13} />
              </div>
            </div>
          </div>
        </div>

        {/* Action menu */}
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
        ownerImageUrl={ownerImageUrl}
        ownerHasImage={ownerHasImage}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onMemberAdded={addMember}
        onMemberAddConfirmed={replaceOptimisticMember}
        onMemberRoleChanged={updateMemberLocal}
        onMemberRemoved={removeMember}
        onProjectUpdated={(updated) => updateProjectLocal(updated)}
      />
    </>
  );
}
