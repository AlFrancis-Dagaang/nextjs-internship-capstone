"use client"

type DayDrillDownData = {
  day: string
  entries: {
    id: string
    action: string
    actorName: string
    taskTitle: string
    projectName: string
    createdAt: string
  }[]
}

export function DayDrillDown({ data }: { data: DayDrillDownData }) {
  if (data.entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No activity recorded for this day.
      </p>
    )
  }

  return (
    <div className="space-y-2.5">
      {data.entries.map((entry) => (
        <div
          key={entry.id}
          className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5 overflow-hidden"
        >
          <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
            <span className="font-semibold text-foreground truncate">
              {entry.actorName}
            </span>
            <span className="shrink-0">
              {new Date(entry.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="text-xs font-semibold text-foreground break-words">
            {entry.action}:{" "}
            <span className="font-normal text-muted-foreground">
              {entry.taskTitle}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            Project: {entry.projectName}
          </div>
        </div>
      ))}
    </div>
  )
}
