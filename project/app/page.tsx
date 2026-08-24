import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features-section";
import { LandingAbout } from "@/components/landing/about-section";
import { LandingFAQ } from "@/components/landing/faq-section";
import { LandingCtaBanner } from "@/components/landing/cta-banner";
import { LandingFooter } from "@/components/landing/footer";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-teal-500 selection:text-white bg-dot-pattern">
      <LandingHeader />
      <main className="flex-1 space-y-6 sm:space-y-10">
        <LandingHero />
        <LandingFeatures />
        <LandingAbout />
        <LandingFAQ />
        <LandingCtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
