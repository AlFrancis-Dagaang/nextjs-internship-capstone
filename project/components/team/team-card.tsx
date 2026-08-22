// components/team/team-card.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceTeam } from "@/lib/services/team";
import { updateTeam, getTeamMembers } from "@/lib/actions/team";
import { TeamCardActions } from "./team-card-actions";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowUpRight } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

type MemberInfo = {
  userId: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  hasImage?: boolean | null;
};

export function TeamCard({
  team,
  isOwner,
  currentUserId,
  initialMembers = [],
  onManageMembers,
  onDeleted,
}: {
  team: WorkspaceTeam;
  isOwner: boolean;
  currentUserId: string;
  initialMembers?: MemberInfo[];
  onManageMembers: (team: WorkspaceTeam) => void;
  onDeleted: (teamId: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [members, setMembers] = useState<MemberInfo[]>(initialMembers);

  useEffect(() => {
    getTeamMembers(team.id).then((res) => {
      if (res.success && res.data) {
        const mapped: MemberInfo[] = (res.data as any[]).map((m) => ({
          userId: m.userId,
          name: m.userName,
          email: m.userEmail,
          imageUrl: m.userImageUrl ?? m.imageUrl,
          hasImage: m.userHasImage ?? m.hasImage,
        }));
        setMembers(mapped);
      }
    });
  }, [team.id]);

  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(team.name);
  const [isRenamePending, startRenameTransition] = useTransition();

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner || !name.trim() || name === team.name) {
      setIsRenaming(false);
      setName(team.name);
      return;
    }
    const submittedName = name;
    setIsRenaming(false);

    startRenameTransition(async () => {
      const result = await updateTeam(team.id, { name: submittedName });
      if (!result.success) {
        toast({
          title: "Failed to rename team",
          description: result.error,
          variant: "destructive",
        });
        setName(team.name);
        return;
      }
      toast({ title: "Team updated", description: result.data?.name });
      router.refresh();
    });
  }

  return (
    <div className="group relative bg-white dark:bg-card backdrop-blur-md rounded-2xl border border-border/90 hover:border-teal-500/50 hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xs">
      {/* Clickable Card Link / Trigger to Manage Members */}
      <div
        onClick={() => onManageMembers(team)}
        className="absolute inset-0 rounded-2xl z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Manage team ${team.name}`}
      />

      {/* Content Header */}
      <div className="relative z-10 space-y-1.5 pointer-events-none">
        <div className="flex items-start justify-between pr-8 gap-2">
          {isOwner && isRenaming ? (
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
                  className="h-8 px-2.5 text-xs font-semibold bg-background border border-input rounded-xl shadow-none focus-visible:ring-1"
                />
              </form>
            </div>
          ) : (
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
              {team.name}
            </h3>
          )}

          {/* Role Badge */}
          {(!isOwner || !isRenaming) && (
            <div className="shrink-0 pointer-events-none">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                {isOwner ? "Owner" : "Member"}
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {isOwner
            ? "You created and manage this team"
            : "Team membership access"}
        </p>
      </div>

      {/* Footer Metadata & SaaS Actions */}
      <div className="relative z-10 pt-3 border-t border-border/60 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Metadata stack (Member Count) */}
          <div className="flex items-center space-x-1.5 text-muted-foreground">
            <Users size={13} className="text-muted-foreground" />
            <span className="font-semibold text-[11px]">
              {members.length > 0 ? members.length : team.memberCount}{" "}
              {members.length === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Unified Avatar Stack */}
          <div
            className="flex items-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center -space-x-1.5">
              {members.slice(0, 3).map((m) => {
                const stableKey = m.userId || m.email;
                const displayName = m.name || m.email || "User";
                return (
                  <UserAvatar
                    key={m.userId}
                    userId={stableKey}
                    name={displayName}
                    imageUrl={m.imageUrl}
                    hasImage={m.hasImage ?? false}
                    className="w-7 h-7 text-[10px] border-2 border-white dark:border-card shadow-2xs"
                    title={displayName}
                  />
                );
              })}
              {members.length > 3 && (
                <div
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-card bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold shadow-2xs"
                  title={`+${members.length - 3} more members`}
                >
                  +{members.length - 3}
                </div>
              )}
            </div>

            {/* SaaS interactive navigation cue icon */}
            <div className="ml-3 w-6 h-6 rounded-xl bg-secondary text-muted-foreground group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs">
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Absolute corner action menu */}
      {isOwner && (
        <div
          className="absolute top-3 right-3 z-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <TeamCardActions
            team={team}
            onDeleted={onDeleted}
            onViewMembers={() => onManageMembers(team)}
            onRename={() => {
              setName(team.name);
              setIsRenaming(true);
            }}
            onMemberAdded={(newMember) =>
              setMembers((prev) => [...prev, newMember])
            }
          />
        </div>
      )}
    </div>
  );
}
