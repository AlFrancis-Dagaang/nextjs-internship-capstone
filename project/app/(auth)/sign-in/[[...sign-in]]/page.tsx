"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Brand / Context Panel */}
      <div className="hidden lg:flex flex-col justify-center p-8 xl:p-12 bg-muted border-r border-border">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center text-background font-semibold text-sm">
              G
            </div>
            <span className="font-semibold text-foreground tracking-tight text-xl">
              GenZpace
            </span>
          </div>

          <div className="space-y-2 text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
              Manage your projects efficiently with GenZpace.
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
        <div className="w-full max-w-sm space-y-4">
          {/* Mobile Header Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center text-background font-semibold text-xs">
              G
            </div>
            <span className="font-semibold text-foreground text-sm tracking-tight">
              GenZpace
            </span>
          </div>

          <div className="w-full">
            <SignIn
              fallbackRedirectUrl="/dashboard"
              appearance={{
                options: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
                variables: {
                  colorPrimary: "var(--foreground)",
                  colorForeground: "var(--foreground)",
                  colorMutedForeground: "var(--muted-foreground)",
                  colorBackground: "transparent",
                  colorInput: "var(--muted)",
                  colorBorder: "var(--border)",
                  colorInputForeground: "var(--foreground)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                },
                elements: {
                  rootBox: "w-full",
                  cardBox: "shadow-none p-0 bg-transparent w-full",
                  card: "bg-transparent shadow-none p-0 w-full text-foreground border-0",
                  headerTitle:
                    "text-xl font-semibold tracking-tight text-foreground text-left mb-1",
                  headerSubtitle:
                    "text-sm text-muted-foreground text-left mb-6",
                  footer: "!hidden",
                  footerAction: "!hidden",
                  socialButtonsBlockButton:
                    "border border-border bg-card text-foreground hover:bg-muted transition-colors font-medium h-10 rounded-md flex items-center justify-center gap-2",
                  socialButtonsBlockButtonText: "font-medium text-foreground",
                  socialButtonsBlockButtonArrow: "text-foreground",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground text-xs uppercase",
                  formFieldLabel:
                    "text-foreground text-xs font-semibold mb-1.5",
                  formFieldInput:
                    "border border-input bg-card text-foreground focus:border-ring focus:bg-background h-10 px-3 rounded-md transition-all",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 rounded-md transition-colors w-full",
                  identityAccountText: "text-foreground",
                  formFieldErrorText: "text-destructive text-xs mt-1",
                  alertText: "text-destructive text-xs",
                },
              }}
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
