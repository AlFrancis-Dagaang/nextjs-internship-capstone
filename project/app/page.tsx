// app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();

  // If the user is logged in, redirect them straight to the dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // Otherwise, show the landing page for unauthenticated visitors
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12">
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase">
            GenZpace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-xs h-9">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
          >
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto text-center space-y-6 py-20">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Manage your projects efficiently with{" "}
          <span className="text-teal-600">GenZpace</span>.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Streamline teamwork, track project progress, organize your calendar,
          and collaborate seamlessly in one unified workspace.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            asChild
            size="lg"
            className="h-11 px-6 text-xs bg-teal-700 hover:bg-teal-800 text-white rounded-2xl gap-2 font-semibold"
          >
            <Link href="/sign-up">
              Start collaborating <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-muted-foreground border-t border-border/80 pt-6">
        &copy; {new Date().getFullYear()} GenZpace. All rights reserved.
      </footer>
    </div>
  );
}
