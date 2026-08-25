"use client"

import { SignIn } from "@clerk/nextjs"
import { Layers } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background bg-dot-pattern font-sans">
      {/* Left Brand / Context Panel */}
      <div className="hidden lg:flex flex-col justify-center p-8 xl:p-12 bg-card/40 backdrop-blur-md border-r border-border/80">
        <div className="max-w-md mx-auto space-y-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <Layers size={20} />
            </div>
            <span className="font-extrabold text-foreground tracking-tight text-xl">
              genzpace
            </span>
          </Link>

          <div className="space-y-3 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Manage your projects efficiently with{" "}
              <span className="text-teal-600 dark:text-teal-400">genzpace</span>
              .
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Streamline workflows, coordinate team objectives, and scale your
              product delivery with precision.
            </p>
          </div>
        </div>
      </div>

      {/* Right Auth Container */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Header Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-sm">
              <Layers size={16} />
            </div>
            <span className="font-extrabold text-foreground text-base tracking-tight">
              genzpace
            </span>
          </div>

          <div className="w-full">
            <SignIn
              fallbackRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  cardBox: "shadow-none p-0 bg-transparent w-full",
                  card: "bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8 w-full text-card-foreground",
                  headerTitle:
                    "text-xl font-bold tracking-tight text-foreground text-left mb-1",
                  headerSubtitle:
                    "text-xs sm:text-sm text-muted-foreground text-left mb-6",
                  footer: "!hidden",
                  footerAction: "!hidden",
                  socialButtonsBlockButton:
                    "border border-border dark:border-white/20 bg-background text-foreground hover:bg-muted/80 hover:border-teal-600 dark:hover:border-teal-400 transition-colors font-medium h-10 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-2xs",
                  socialButtonsBlockButtonText:
                    "font-medium !text-foreground dark:!text-white",
                  dividerLine: "bg-border",
                  dividerText:
                    "text-muted-foreground text-xs uppercase font-medium",
                  formFieldLabel:
                    "text-foreground text-xs font-semibold mb-1.5",
                  formFieldInput:
                    "border border-input bg-background text-foreground focus:border-ring focus:ring-1 focus:ring-ring h-10 px-3 rounded-xl text-xs sm:text-sm transition-all shadow-2xs",
                  formButtonPrimary:
                    "bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold h-10 rounded-xl text-xs sm:text-sm transition-colors w-full shadow-md cursor-pointer",
                  identityAccountText: "text-foreground",
                  formFieldErrorText:
                    "text-destructive text-xs mt-1 font-medium",
                  alertText: "text-destructive text-xs",
                  formFieldSuccessText: "text-teal-600 text-xs",
                },
              }}
            />
          </div>

          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-teal-600 dark:text-teal-400 underline underline-offset-4 hover:opacity-80"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
