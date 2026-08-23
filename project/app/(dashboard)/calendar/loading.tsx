// app/(dashboard)/calendar/loading.tsx
export default function CalendarLoading() {
  return (
    <div className="w-full space-y-6 pb-12 px-2 sm:px-0 animate-pulse">
      {/* Header Area Skeleton matching PageHeader */}
      <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="h-5 w-44 rounded-md bg-muted" />
          <div className="h-3.5 w-80 rounded bg-muted" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-muted shrink-0" />
      </div>

      {/* Main Grid & Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Calendar Grid Skeleton */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Month Navigation Bar Skeleton */}
          <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="h-9 w-20 rounded-xl bg-muted" />
          </div>

          {/* Calendar Grid Box Skeleton */}
          <div className="bg-card rounded-3xl border border-border/80 overflow-hidden shadow-xs flex flex-col h-[740px]">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b border-border/60 bg-secondary/55 py-3 shrink-0">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex justify-center">
                  <div className="h-3 w-8 rounded bg-muted" />
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="p-2.5 flex flex-col justify-between border-b border-r border-border/60 bg-card/40"
                >
                  <div className="w-6 h-6 rounded-full bg-muted" />
                  <div className="space-y-1 mt-auto">
                    {i % 3 === 0 && (
                      <div className="h-3 w-full rounded bg-muted/60" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Skeletons */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Month Overview Metrics Card Skeleton */}
          <div className="bg-card rounded-3xl border border-border/80 p-5 shadow-xs flex flex-col shrink-0 space-y-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col p-2.5 rounded-2xl bg-secondary/50 border border-border/65 items-center space-y-1.5"
                >
                  <div className="h-2.5 w-10 rounded bg-muted" />
                  <div className="h-5 w-6 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Panel Skeleton */}
          <div className="bg-card rounded-3xl border border-border/80 p-5 shadow-xs flex flex-col h-[320px] space-y-3">
            <div className="pb-3 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="h-4 w-36 rounded bg-muted" />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
          </div>

          {/* Upcoming Milestones Queue Card Skeleton */}
          <div className="bg-card rounded-3xl border border-border/80 p-5 shadow-xs flex flex-col h-[320px] space-y-3">
            <div className="pb-3 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
            <div className="flex-1 space-y-2.5 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl border border-border/80 bg-secondary/30 space-y-2"
                >
                  <div className="flex justify-between">
                    <div className="h-3.5 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-12 rounded-full bg-muted" />
                  </div>
                  <div className="flex justify-between pt-1">
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
