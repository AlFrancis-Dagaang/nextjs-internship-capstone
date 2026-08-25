// app/projects/loading.tsx
export default function ProjectsLoading() {
  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12 px-2 sm:px-0 animate-pulse">
      {/* Header Area Skeleton matching PageHeader */}
      <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="h-5 w-28 rounded-md bg-muted" />
          <div className="h-3.5 w-60 rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-muted shrink-0" />
      </div>

      {/* Recently Viewed Strip Skeleton */}
      <section className="space-y-3">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="flex gap-3 overflow-hidden pb-2 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-60 p-4 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your Projects Section Skeleton */}
      <section className="space-y-3 sm:space-y-4">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((cardIndex) => (
            <div
              key={cardIndex}
              className="relative rounded-3xl border border-border bg-card p-5 flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-3/5 rounded bg-muted" />
                  <div className="h-5 w-14 rounded-full bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3.5 w-16 rounded bg-muted" />
                  <div className="h-3.5 w-6 rounded bg-muted" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div className="w-6 h-6 rounded-full bg-muted" />
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shared With You Section Skeleton */}
      <section className="space-y-3 sm:space-y-4 pt-2">
        <div className="h-3.5 w-36 rounded bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2].map((sharedIndex) => (
            <div
              key={sharedIndex}
              className="relative rounded-3xl border border-border bg-card p-5 flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-3/5 rounded bg-muted" />
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="w-7 h-7 rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
