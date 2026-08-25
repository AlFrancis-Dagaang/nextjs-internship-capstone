// app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 pb-12 px-2 sm:px-0 animate-pulse">
      {/* Welcome & Quick Stats Header Banner Skeleton */}
      <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="h-5 w-48 rounded-md bg-muted" />
          <div className="h-3.5 w-80 rounded bg-muted" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-full sm:w-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>

      {/* 3-Column Equal Height Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {[1, 2, 3].map((cardIndex) => (
          <div
            key={cardIndex}
            className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full space-y-4"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-4 w-6 rounded-full bg-muted" />
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((itemIndex) => (
                  <div
                    key={itemIndex}
                    className="p-3 rounded-2xl bg-secondary/30 border border-border/65 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-12 rounded-full bg-muted" />
                    </div>
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-border/60 flex justify-end">
              <div className="h-3.5 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stacked Banners Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((bannerIndex) => (
          <div
            key={bannerIndex}
            className="p-4 sm:p-5 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full"
          >
            <div className="flex items-start sm:items-center gap-3.5 w-full">
              <div className="w-10 h-10 rounded-2xl bg-muted shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-3.5 w-3/4 rounded bg-muted" />
              </div>
            </div>
            <div className="h-9 w-32 rounded-xl bg-muted shrink-0 w-full sm:w-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
