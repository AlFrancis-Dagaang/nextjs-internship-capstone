// app/(dashboard)/projects/[id]/team/loading.tsx
export default function ProjectTeamLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Container Skeleton matching ProjectTeamPage header */}
      <div className="p-5 sm:p-6 bg-card/70 backdrop-blur-md border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0 w-full sm:w-auto">
          {/* Back button skeleton */}
          <div className="h-9 w-9 rounded-2xl bg-muted shrink-0" />

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="h-5 w-56 rounded-md bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted shrink-0" />
            </div>
            <div className="h-3.5 w-72 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton (matching ProjectTeamView structure) */}
      <div className="space-y-6">
        {/* Tab / Section Switcher Skeleton */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="h-9 w-32 rounded-xl bg-muted" />
          <div className="h-9 w-32 rounded-xl bg-muted" />
        </div>

        {/* Members/Teams List Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-card border border-border rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-muted shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-6 w-16 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
