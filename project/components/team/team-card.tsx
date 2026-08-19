"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceTeam } from "@/lib/services/team";
import { updateTeam, getTeamMembers } from "@/lib/actions/team";
import { TeamCardActions } from "./team-card-actions";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowUpRight } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

type MemberInfo = {
  userId: string;
  name: string;
  email: string;
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

  // Fetch members on mount so avatars show up and persist after refresh
  useEffect(() => {
    getTeamMembers(team.id).then((res) => {
      if (res.success && res.data) {
        const mapped: MemberInfo[] = (res.data as any[]).map((m) => ({
          userId: m.userId,
          name: m.userName,
          email: m.userEmail,
        }));
        setMembers(mapped);
      }
    });
  }, [team.id]);

  // Inline rename state (Only active if owner)
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
    <div className="group relative bg-card backdrop-blur-xl rounded-xl border border-border hover:border-ring hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-sm">
      {/* Clickable Card Link / Trigger to Manage Members */}
      <div
        onClick={() => onManageMembers(team)}
        className="absolute inset-0 rounded-xl z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Manage team ${team.name}`}
      />

      {/* Content Header */}
      <div className="relative z-10 space-y-2 pointer-events-none">
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
                  className="h-8 px-2.5 text-sm font-medium bg-card border border-input rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-ring"
                />
              </form>
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
              {team.name}
            </h3>
          )}

          {/* Role / Ownership Badge */}
          {(!isOwner || !isRenaming) && (
            <div className="shrink-0 pointer-events-none">
              {isOwner ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                  Owner
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                  Member
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground/80 line-clamp-1">
          {isOwner
            ? "You created and manage this team"
            : "Team membership access"}
        </p>
      </div>

      {/* Footer Metadata & SaaS Actions */}
      <div className="relative z-10 pt-3 border-t border-border flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Metadata stack (Member Count) */}
          <div className="flex items-center space-x-1.5 text-muted-foreground">
            <Users size={13} className="text-muted-foreground" />
            <span className="font-medium text-[11px]">
              {members.length > 0 ? members.length : team.memberCount}{" "}
              {members.length === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Unified Colored Avatar Stack matching ProjectCard style */}
          <div
            className="flex items-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center -space-x-1.5">
              {members.slice(0, 3).map((m) => {
                const stableKey = m.userId || m.email;
                return (
                  <div
                    key={m.userId}
                    className={`w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold uppercase shadow-sm ${getAvatarColor(
                      stableKey,
                    )}`}
                    title={`${m.name ?? m.email}`}
                  >
                    {getInitials(m.name || m.email || "U")}
                  </div>
                );
              })}
              {members.length > 3 && (
                <div
                  className="w-7 h-7 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shadow-sm"
                  title={`+${members.length - 3} more members`}
                >
                  +{members.length - 3}
                </div>
              )}
            </div>

            {/* SaaS interactive navigation cue icon */}
            <div className="ml-3 w-6 h-6 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-200 shadow-sm">
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Absolute corner action menu (Isolated for owners only) */}
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
