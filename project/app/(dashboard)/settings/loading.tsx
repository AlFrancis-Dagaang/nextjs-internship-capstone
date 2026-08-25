export default function SettingsLoading() {
  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12 px-2 sm:px-0 animate-pulse">
      {/* Header Area Skeleton matching PageHeader */}
      <div className="p-4 sm:p-6 bg-card border border-border/80 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="h-5 w-24 rounded-md bg-muted" />
          <div className="h-3.5 w-96 rounded bg-muted" />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Card Skeleton */}
        <div className="lg:col-span-1 bg-card border border-border/80 rounded-3xl shadow-xs p-3 space-y-2">
          <div className="hidden lg:block px-3 py-2">
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          <div className="flex lg:flex-col gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-full rounded-2xl lg:rounded-xl bg-muted shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Right Content Panel Skeleton */}
        <div className="lg:col-span-3 bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="space-y-2 pb-4 border-b border-border/60">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-3.5 w-64 rounded bg-muted" />
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex justify-end">
            <div className="h-9 w-24 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
