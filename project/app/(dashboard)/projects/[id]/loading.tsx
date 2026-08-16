// app/(dashboard)/projects/[id]/loading.tsx

export default function ProjectLoading() {
  return (
    <div className="flex flex-col gap-2 bg-transparent px-0 py-0 m-0 animate-pulse w-full h-full overflow-hidden">
      {/* Header Area Skeleton matching ProjectHeader structure */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1 shrink-0">
        {/* Left side: Back button + Title & Avatars */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-5 w-48 rounded bg-muted" />

            {/* Avatars skeleton */}
            <div className="hidden sm:flex items-center">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-card" />
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-card" />
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-card" />
              </div>
            </div>
          </div>
        </div>

        {/* Right side controls skeleton */}
        <div className="flex items-center space-x-3 ml-auto flex-wrap">
          <div className="relative w-64 sm:w-80 md:w-96 hidden sm:block">
            <div className="h-8 w-full rounded-lg bg-muted" />
          </div>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-16 rounded-lg bg-muted" />
            <div className="h-8 w-20 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* Board Area Skeleton with 4 list columns matching real board height */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-6 pt-2">
        <div className="flex items-start space-x-6 min-w-max h-full px-1">
          {[1, 2, 3, 4].map((colIndex) => (
            <div
              key={colIndex}
              className="shrink-0 w-80 bg-secondary/60 rounded-xl p-3 flex flex-col h-full max-h-full space-y-3 border border-border"
            >
              {/* List Header Skeleton */}
              <div className="flex items-center justify-between px-1 pb-1 shrink-0">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-4 w-6 rounded bg-muted" />
              </div>

              {/* Scrollable Task Cards Container (Long columns with 4 cards to simulate full height) */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {[1, 2, 3, 4].map((taskIndex) => (
                  <div
                    key={taskIndex}
                    className="relative p-3.5 pt-4 bg-card rounded-xl border border-border space-y-3 shrink-0 shadow-sm"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-muted" />

                    <div className="flex items-center space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-muted shrink-0" />
                      <div className="h-4 w-3/4 rounded bg-muted" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-3">
                        <div className="h-3.5 w-16 rounded bg-muted" />
                        <div className="h-3.5 w-6 rounded bg-muted" />
                      </div>
                      <div className="flex items-center -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-muted" />
                        <div className="w-6 h-6 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add task button footer skeleton */}
              <div className="pt-2 shrink-0">
                <div className="h-8 w-full rounded-lg bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
