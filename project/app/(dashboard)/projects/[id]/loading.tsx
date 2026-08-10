// app/(dashboard)/projects/[id]/loading.tsx

export default function ProjectLoading() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden space-y-6 animate-pulse">
      {/* Header Area Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-transparent px-0 py-0 m-0 shrink-0">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 shrink-0" />
          <div className="min-w-0 space-y-1.5">
            <div className="h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>

        <div className="flex items-center space-x-3 ml-auto flex-wrap">
          <div className="hidden sm:block h-8 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="hidden lg:flex items-center space-x-1.5">
            <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Board Area Skeleton with long list columns matching real board height */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-6">
        <div className="flex items-start space-x-6 min-w-max h-full px-1">
          {[1, 2, 3].map((colIndex) => (
            <div
              key={colIndex}
              className="shrink-0 w-80 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl p-3 flex flex-col h-full max-h-full space-y-3"
            >
              {/* List Header Skeleton */}
              <div className="flex items-center justify-between px-1 pb-1 shrink-0">
                <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-6 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>

              {/* Scrollable Task Cards Container (Long columns with 4 cards to simulate full height) */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {[1, 2, 3, 4].map((taskIndex) => (
                  <div
                    key={taskIndex}
                    className="relative p-3.5 pt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 shrink-0"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-neutral-200 dark:bg-neutral-800" />

                    <div className="flex items-center space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                      <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-3">
                        <div className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="h-3.5 w-6 rounded bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div className="flex items-center -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add task button footer skeleton */}
              <div className="pt-2 shrink-0">
                <div className="h-8 w-full rounded-lg bg-neutral-200/60 dark:bg-neutral-800/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
