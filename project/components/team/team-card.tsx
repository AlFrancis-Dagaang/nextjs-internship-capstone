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

function mapMemberInfo(member: any): MemberInfo {
  const imageUrl =
    member.userImageUrl ?? member.imageUrl ?? member.image ?? null;

  return {
    userId: member.userId ?? member.id,
    name: member.userName ?? member.name ?? "",
    email: member.userEmail ?? member.email ?? "",
    imageUrl,
    hasImage: member.userHasImage ?? member.hasImage ?? !!imageUrl,
  };
}

export function TeamCard({
  team,
  creatorName,
  isOwner,
  currentUserId,
  initialMembers = [],
  onManageMembers,
  onDeleted,
}: {
  team: WorkspaceTeam;
  creatorName: string;
  isOwner: boolean;
  currentUserId: string;
  initialMembers?: MemberInfo[];
  onManageMembers: (team: WorkspaceTeam) => void;
  onDeleted: (teamId: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Single declaration using initialMembers as primary source of truth
  const [members, setMembers] = useState<MemberInfo[]>(initialMembers);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(team.name);
  const [isRenamePending, startRenameTransition] = useTransition();

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    setName(team.name);
  }, [team.name]);

  // Fetch team members locally on mount / team change
  useEffect(() => {
    let cancelled = false;

    getTeamMembers(team.id)
      .then((res) => {
        if (cancelled) return;

        if (res.success && res.data) {
          const mapped = (res.data as any[]).map(mapMemberInfo);
          setMembers(mapped);
        } else {
          setMembers([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [team.id]);

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isOwner || !name.trim() || name === team.name) {
      setIsRenaming(false);
      setName(team.name);
      return;
    }

    const submittedName = name.trim();
    setIsRenaming(false);

    startRenameTransition(async () => {
      const result = await updateTeam(team.id, {
        name: submittedName,
      });

      if (!result.success) {
        toast({
          title: "Failed to rename team",
          description: result.error,
          variant: "destructive",
        });

        setName(team.name);
        return;
      }

      toast({
        title: "Team updated",
        description: result.data?.name,
      });

      router.refresh();
    });
  }

  function handleAddNewMember(newMember: MemberInfo) {
    setMembers((prev) => {
      if (prev.some((member) => member.userId === newMember.userId)) {
        return prev;
      }
      return [...prev, newMember];
    });
  }

  return (
    <div className="group relative bg-white dark:bg-card backdrop-blur-md rounded-2xl border border-border/90 hover:border-teal-500/50 hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xs">
      <div
        onClick={() => onManageMembers(team)}
        className="absolute inset-0 rounded-2xl z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Manage team ${team.name}`}
      />

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

          {(!isOwner || !isRenaming) && (
            <div className="shrink-0 pointer-events-none">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60">
                {isOwner ? "Owner" : "Member"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {isOwner
              ? "You created and manage this team"
              : "Team membership access"}
          </p>

          <div className="text-[10px] text-muted-foreground/80 pt-0.5 truncate">
            Created by:{" "}
            <span className="text-foreground font-semibold">
              {isOwner ? "You" : creatorName}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-3 border-t border-border/60 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1.5 text-muted-foreground">
            <Users size={13} className="text-muted-foreground" />

            <span className="font-semibold text-[11px]">
              {members.length > 0 ? members.length : team.memberCount}{" "}
              {members.length === 1 ? "member" : "members"}
            </span>
          </div>

          <div
            className="flex items-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center -space-x-1.5">
              {members.slice(0, 3).map((member) => {
                const stableKey = member.userId || member.email;
                const displayName = member.name || member.email || "User";
                const resolvedImage = member.imageUrl ?? null;

                return (
                  <UserAvatar
                    key={stableKey}
                    userId={stableKey}
                    name={displayName}
                    imageUrl={resolvedImage}
                    hasImage={member.hasImage ?? !!resolvedImage}
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

            <div className="ml-3 w-6 h-6 rounded-xl bg-secondary text-muted-foreground group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs">
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>

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
            onMemberAdded={handleAddNewMember}
          />
        </div>
      )}
    </div>
  );
}
