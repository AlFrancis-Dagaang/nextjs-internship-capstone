import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingCtaBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-up">
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-12 text-center border border-border/40 shadow-xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-3">
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Elevate Your Work Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Discover the secret behind thriving teams—experience seamless
            projects and unstoppable productivity.
          </p>
          <div className="pt-2">
            <Button
              asChild
              size="sm"
              className="h-10 px-6 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg transition-all"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
