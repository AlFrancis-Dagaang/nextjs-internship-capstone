"use client"

import { CheckCircle2, Clock } from "lucide-react"

type ProjectDrillDownData = {
  projectName: string
  open: {
    id: string
    title: string
    priority: string | null
    dueDate: string | null
  }[]
  completed: {
    id: string
    title: string
    priority: string | null
    dueDate: string | null
  }[]
}

export function ProjectDrillDown({ data }: { data: ProjectDrillDownData }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Clock size={12} className="text-amber-500 shrink-0" />
          <span>Open Tasks ({data.open.length})</span>
        </h4>
        {data.open.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No open tasks.</p>
        ) : (
          <div className="space-y-2.5">
            {data.open.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5 overflow-hidden"
              >
                <div className="text-xs font-semibold text-foreground break-words">
                  {task.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {task.priority && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60 shrink-0">
                      {task.priority}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="truncate">Due: {task.dueDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
          <span>Completed Tasks ({data.completed.length})</span>
        </h4>
        {data.completed.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No completed tasks.
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.completed.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl border border-border/80 bg-secondary/30 shadow-2xs space-y-1.5 overflow-hidden"
              >
                <div className="text-xs font-semibold text-foreground break-words">
                  {task.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {task.priority && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border/60 shrink-0">
                      {task.priority}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="truncate">Due: {task.dueDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
