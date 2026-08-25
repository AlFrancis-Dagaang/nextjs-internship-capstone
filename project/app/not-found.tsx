"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  // ✅ HOOK RULE: Hooks must be at the very top level, unconditionally!
  const pathname = usePathname();

  // Safely determine the context based on the URL path
  const isProjectRoute = pathname?.startsWith("/projects");
  const isDashboardRoute =
    isProjectRoute ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/team") ||
    pathname?.startsWith("/analytics") ||
    pathname?.startsWith("/calendar") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/my-tasks");

  // Dynamic Button Routing
  const targetHref = isDashboardRoute ? "/dashboard" : "/";
  const buttonText = isDashboardRoute ? "Return to Dashboard" : "Go Home";

  // Dynamic Text based on whether it's a Project or a general page
  const errorTitle = isProjectRoute ? "Project Not Found" : "Page Not Found";

  const errorMessage = isProjectRoute
    ? "The project you are trying to access doesn't exist, has been deleted, or you don't have permission to view it."
    : "The page you are trying to access doesn't exist or has been moved.";

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4 bg-dot-pattern">
      <div className="text-center space-y-4 max-w-md p-8 bg-card border border-border rounded-3xl shadow-xs animate-fade-up">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            404 Error
          </span>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {errorTitle}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {errorMessage}
          </p>
        </div>

        <div className="pt-2">
          <Button
            asChild
            size="sm"
            className="rounded-xl shadow-xs cursor-pointer"
          >
            {/* Standard anchor tag to force a hard reload and clear any stuck Next.js router states */}
            <a href={targetHref}>{buttonText}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
