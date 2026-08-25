export default function MyTasksLoading() {
  return (
    <div className="flex flex-col gap-4 bg-transparent px-0 py-0 m-0 animate-pulse w-full h-full overflow-hidden">
      {/* Header Area Skeleton matching ProjectHeader layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-card/70 backdrop-blur-md p-4 sm:p-5 border border-border/80 rounded-3xl shadow-xs shrink-0">
        {/* Left side: Back button + Title & Badge */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-muted shrink-0" />
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-5 w-36 rounded-md bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted shrink-0" />
          </div>
        </div>

        {/* Right side controls skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:space-x-2.5 sm:ml-auto w-full sm:w-auto">
          {/* Search input skeleton */}
          <div className="relative w-full sm:w-52 md:w-60">
            <div className="h-9 w-full rounded-xl bg-muted" />
          </div>

          <div className="flex items-center gap-2 justify-end shrink-0">
            {/* Calendar / Filter button skeleton */}
            <div className="h-9 w-24 rounded-xl bg-muted" />
          </div>
        </div>
      </div>

      {/* Board Area Skeleton with 4 list columns matching real board layout */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-6 pt-2">
        <div className="flex items-start space-x-6 min-w-max h-full px-1">
          {[1, 2, 3, 4].map((colIndex) => (
            <div
              key={colIndex}
              className="shrink-0 w-80 bg-card/50 backdrop-blur-md border border-border/85 rounded-3xl p-4 flex flex-col h-full max-h-full space-y-3"
            >
              {/* List Header Skeleton */}
              <div className="flex items-center justify-between pb-3 px-1.5 shrink-0">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-5 w-6 rounded-full bg-muted" />
              </div>

              {/* Scrollable Task Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 px-1 py-1">
                {[1, 2, 3].map((taskIndex) => (
                  <div
                    key={taskIndex}
                    className="relative p-3.5 pt-4 bg-card rounded-xl border border-border space-y-3 shrink-0 shadow-2xs"
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
