"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function LandingFAQ() {
  const faqs = [
    {
      q: "What advanced security measures do you have in place?",
      a: "We implement robust end-to-end encryption, regular penetration testing, and strict access controls compliant with modern industry standards to protect your workspace data.",
    },
    {
      q: "What analytics and reporting capabilities does the platform offer?",
      a: "Our platform provides real-time progress tracking, task completion velocity metrics, and customized workload distribution insights across your active projects.",
    },
    {
      q: "How do integrations work with third-party tools?",
      a: "We support seamless connections with leading collaboration tools, code repositories, and calendar suites to keep your entire development and management pipeline synchronized.",
    },
    {
      q: "Can I customize workflows to match our unique processes?",
      a: "Yes! You can completely tailor your Kanban board lists, status columns, automated task rules, and access permission tiers to match your team's exact workflow.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 border-t border-border/60 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 space-y-3 text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Need Help?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
            Find clear answers to most common questions to help you navigate our
            platform.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-foreground hover:bg-muted/50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
