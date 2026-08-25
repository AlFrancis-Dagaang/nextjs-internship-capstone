// app/(dashboard)/analytics/loading.tsx
export default function AnalyticsLoading() {
  return (
    <div className="w-full space-y-6 pb-12 px-2 sm:px-0 animate-pulse">
      {/* Header Area Skeleton matching PageHeader */}
      <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="h-5 w-36 rounded-md bg-muted" />
          <div className="h-3.5 w-80 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-40 rounded-xl bg-muted" />
          <div className="h-9 w-36 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Tab Toggle Navigation Skeleton */}
      <div className="flex items-center space-x-1 sm:space-x-2 bg-secondary/70 p-1 rounded-2xl border border-border/60 w-full sm:w-fit">
        <div className="h-8 w-24 rounded-xl bg-muted" />
        <div className="h-8 w-32 rounded-xl bg-muted" />
        <div className="h-8 w-20 rounded-xl bg-muted" />
      </div>

      {/* Overview Cards Grid Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 bg-card border border-border rounded-3xl shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 rounded bg-muted" />
                <div className="w-7 h-7 rounded-xl bg-muted" />
              </div>
              <div className="space-y-1.5">
                <div className="h-7 w-16 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart / Progress Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-card border border-border rounded-3xl space-y-4 shadow-2xs">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-64 w-full rounded-2xl bg-muted/50" />
          </div>
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-2xs">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-3 w-10 rounded bg-muted" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
