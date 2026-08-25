// components/layout/page-header.tsx
import type React from "react"

type PageHeaderProps = {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <h1 className="text-base font-semibold tracking-tight text-foreground truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 *:w-full sm:*:w-auto justify-end">
          {children}
        </div>
      )}
    </div>
  )
}
