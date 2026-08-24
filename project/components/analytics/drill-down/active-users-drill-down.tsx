"use client";

type ActiveUsersDrillDownData = {
  members: { actorId: string; name: string; actionCount: number }[];
};

export function ActiveUsersDrillDown({
  data,
}: {
  data: ActiveUsersDrillDownData;
}) {
  if (data.members.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No active users in this period.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.members
        .sort((a, b) => b.actionCount - a.actionCount)
        .map((member) => (
          <div
            key={member.actorId}
            className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs flex items-center justify-between gap-3 overflow-hidden"
          >
            <span className="text-xs font-semibold text-foreground truncate">
              {member.name}
            </span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/60 shrink-0">
              {member.actionCount} actions
            </span>
          </div>
        ))}
    </div>
  );
}
