"use client"

type VelocityDrillDownData = {
  entries: {
    id: string
    taskTitle: string
    projectName: string
    actorName: string
    createdAt: string
  }[]
}

export function VelocityDrillDown({ data }: { data: VelocityDrillDownData }) {
  if (data.entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No completed tasks in this period.
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
          <div className="text-xs font-semibold text-foreground break-words">
            {entry.taskTitle}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-1">
            <span className="truncate">Project: {entry.projectName}</span>
            <span className="shrink-0">By {entry.actorName}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
