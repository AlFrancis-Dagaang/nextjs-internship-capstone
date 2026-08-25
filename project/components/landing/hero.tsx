import { Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-4 pb-6 sm:pt-6 sm:pb-8 px-4 sm:px-6 animate-fade-up">
      <div className="max-w-6xl mx-auto text-center space-y-3 sm:space-y-4">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-[10px] font-semibold text-foreground shadow-2xs">
          <Zap size={11} className="text-teal-600 dark:text-teal-400" />
          <span>Streamline your workflow with ease</span>
        </div>

        {/* Main Heading & Subtitle */}
        <div className="space-y-1.5 max-w-3xl mx-auto px-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-foreground">
            All you need for seamless{" "}
            <span className="text-teal-600 dark:text-teal-400">
              project management
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md sm:max-w-lg mx-auto">
            Empower your team with an intuitive project management tool that
            keeps your work organized and your goals in sight.
          </p>
        </div>

        {/* Central Call to Action Button */}
        <div>
          <Button
            asChild
            size="sm"
            className="h-9 px-6 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-md transition-all hover:scale-105"
          >
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>

        {/* Dashboard Preview Image Showcase */}
        <div
          className="pt-2 relative mx-auto max-w-5xl px-2 sm:px-0"
          id="workspace"
        >
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-background rounded-xl sm:rounded-none overflow-hidden shadow-xl sm:shadow-none border border-border/40 sm:border-0">
            {/* Light Mode Image */}
            <Image
              src="/images/landing/dashboard-light.png"
              alt="Genzpace Dashboard Light Mode Preview"
              fill
              priority
              className="block dark:hidden object-cover object-top w-full h-full rounded-none shadow-none border-0 p-0"
            />

            {/* Dark Mode Image */}
            <Image
              src="/images/landing/dashboard-dark.png"
              alt="Genzpace Dashboard Dark Mode Preview"
              fill
              priority
              className="hidden dark:block object-cover object-top w-full h-full rounded-none shadow-none border-0 p-0"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
