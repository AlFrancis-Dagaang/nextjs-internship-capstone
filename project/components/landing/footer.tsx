import Link from "next/link";
import { Layers } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/80 bg-secondary/30 mt-8">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center">
            <Layers size={11} />
          </div>
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
  );
}
