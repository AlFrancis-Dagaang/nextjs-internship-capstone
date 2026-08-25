export function LandingAbout() {
  return (
    <section
      id="about"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 border-t border-border/60 animate-fade-up"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-3 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Built for modern digital creators
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            genzpace is designed to cut through project noise. We combine
            high-performance database speed with fluid user experience, allowing
            developers, students, and teams to focus purely on executing their
            ideas.
          </p>
        </div>

        <div className="lg:col-span-6 bg-card p-5 sm:p-6 rounded-3xl border border-border shadow-xs">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/40">
              <p className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                99.9%
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                Uptime Reliability
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/40">
              <p className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                Instant
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                Realtime Sync
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
