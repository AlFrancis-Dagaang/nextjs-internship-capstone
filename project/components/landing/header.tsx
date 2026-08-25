import { Layers } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60 animate-fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <Layers size={16} />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight">
            genZpace
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-muted-foreground">
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs h-8 sm:h-9 font-medium px-2.5 sm:px-3"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="text-xs h-8 sm:h-9 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm px-3 sm:px-4"
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
