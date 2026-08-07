export default function ProjectsLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header Area Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-60 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Recently Viewed Strip Skeleton */}
      <section className="space-y-3">
        <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex gap-3 overflow-hidden pb-2 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-3"
            >
              <div className="space-y-1.5">
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
              <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your Projects Section Skeleton */}
      <section className="space-y-4">
        <div className="h-5 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((cardIndex) => (
            <div
              key={cardIndex}
              className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-5 w-14 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3.5 w-6 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
