import { UserAvatar } from "@/components/ui/user-avatar";
import type { ProjectMember } from "@/types";

type ProjectMemberStackProps = {
  members: ProjectMember[];
};

export function ProjectMemberStack({ members }: ProjectMemberStackProps) {
  return (
    <div className="flex items-center -space-x-1.5">
      {members.slice(0, 3).map((m) => (
        <UserAvatar
          key={m.id}
          userId={m.userId || m.email || m.id}
          name={m.name || m.email || "U"}
          imageUrl={m.imageUrl}
          hasImage={Boolean(m.hasImage)}
          className="w-7 h-7"
          title={`${m.name ?? m.email ?? "Member"} (${m.role})`}
        />
      ))}
      {members.length > 3 && (
        <div
          className="w-7 h-7 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shadow-2xs"
          title={`+${members.length - 3} more members`}
        >
          +{members.length - 3}
        </div>
      )}
    </div>
  );
}
