import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layout, Calendar, Users } from "lucide-react";

// Corrected, clean GZ Monogram Logo component
function GzLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white border border-border shadow-sm overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[72%] h-[72%] text-teal-700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer G curve */}
        <path
          d="M62 25C55 17 44 13 32 13C16 13 3 26 3 42C3 58 16 71 32 71C46 71 58 60 61 45H32"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Inner Z stroke */}
        <path
          d="M36 45H79L48 76H83"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GzLogo className="w-10 h-10" />
            <span className="font-extrabold text-base tracking-tight">
              genzpace
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#workspace"
              className="hover:text-foreground transition-colors"
            >
              Workspace
            </Link>
            <Link
              href="#about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs h-9 font-medium"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm"
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* LEFT COLUMN: Text and CTAs */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Manage your projects efficiently with{" "}
                <span className="text-teal-600 dark:text-teal-400">
                  genzpace
                </span>
                .
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Streamline teamwork, track project progress, organize your
                calendar, and collaborate seamlessly in one unified workspace
                built for speed.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-2xl gap-2 font-semibold shadow-lg shadow-teal-700/20 transition-all hover:scale-[1.02]"
                >
                  <Link href="/sign-up">
                    Start collaborating <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-sm rounded-2xl font-semibold border-border/80"
                >
                  <Link href="/sign-in">Explore Demo</Link>
                </Button>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Board Mockup */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-2xl rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-black/5 dark:shadow-teal-950/20">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

                {/* Window Control Bar */}
                <div className="flex items-center justify-between pb-3 px-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground font-medium bg-secondary px-3 py-1 rounded-md">
                    app.genzpace.com/dashboard
                  </div>
                  <div className="w-12" />
                </div>

                {/* Kanban Board Columns Mockup */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 sm:p-4 text-left">
                  {/* To Do Column */}
                  <div className="bg-muted/60 p-3 rounded-xl border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>To Do</span>
                      <span className="bg-card px-2 py-0.5 rounded-full border border-border">
                        3
                      </span>
                    </div>
                    <div className="bg-card p-2.5 rounded-lg border border-border shadow-xs space-y-1">
                      <p className="text-xs font-semibold">
                        Authentication Flow
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        Integrate Clerk and session rules.
                      </p>
                    </div>
                    <div className="bg-card p-2.5 rounded-lg border border-border shadow-xs space-y-1">
                      <p className="text-xs font-semibold">Design System</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        Align Tailwind v4 variables.
                      </p>
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="bg-muted/60 p-3 rounded-xl border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                      <span>In Progress</span>
                      <span className="bg-card px-2 py-0.5 rounded-full border border-border">
                        1
                      </span>
                    </div>
                    <div className="bg-card p-2.5 rounded-lg border border-teal-500/30 shadow-xs space-y-1 ring-1 ring-teal-500/20">
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        Landing Page Redesign
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        Decouple components & mobile layout.
                      </p>
                    </div>
                  </div>

                  {/* Done Column */}
                  <div className="bg-muted/60 p-3 rounded-xl border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Done</span>
                      <span className="bg-card px-2 py-0.5 rounded-full border border-border">
                        2
                      </span>
                    </div>
                    <div className="bg-card p-2.5 rounded-lg border border-border shadow-xs space-y-1 opacity-75">
                      <p className="text-xs font-semibold line-through">
                        Database Schema
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        Configure Prisma relations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-border/60"
        >
          <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Everything you need to ship faster
            </h2>
            <p className="text-sm text-muted-foreground">
              Powerful modules built right into your core workspace experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <Layout size={20} />
              </div>
              <h3 className="font-bold text-base">Kanban & Boards</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visual boards that adapt to your sprint cadence without the
                clutter.
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-base">Smart Calendars</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Never miss a deadline with integrated timelines and priority
                schedules.
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-base">Real-time Teamwork</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep your entire squad synced with instantaneous feedback loops.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-secondary/30">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GzLogo className="w-6 h-6" />
            <span className="font-semibold text-foreground">genzpace</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
