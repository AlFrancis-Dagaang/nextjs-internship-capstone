"use client"

type AvgTaskTimeDrillDownData = {
  tasks: {
    taskId: string
    title: string
    projectName: string
    durationDays: number
  }[]
}

export function AvgTaskTimeDrillDown({
  data,
}: {
  data: AvgTaskTimeDrillDownData
}) {
  if (data.tasks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No task duration data available.
      </p>
    )
  }

  return (
    <div className="space-y-2.5">
      {data.tasks
        .sort((a, b) => b.durationDays - a.durationDays)
        .map((task) => (
          <div
            key={task.taskId}
            className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5 overflow-hidden"
          >
            <div className="text-xs font-semibold text-foreground break-words">
              {task.title}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
              <span className="truncate">Project: {task.projectName}</span>
              <span className="font-semibold text-foreground shrink-0">
                {task.durationDays.toFixed(1)} days
              </span>
            </div>
          </div>
        ))}
    </div>
  )
}
