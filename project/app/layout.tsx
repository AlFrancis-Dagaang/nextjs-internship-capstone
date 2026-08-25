// app/layout.tsx
import type { Metadata } from "next";
import type React from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "genzpace",
  description: "Manage your projects efficiently with GenZpace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>GenZpace</title>
        <meta
          name="description"
          content="Manage your projects efficiently with GenZpace."
        />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="bg-background text-foreground min-h-screen antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: "#0F766E",
                colorForeground: "var(--foreground)",
                colorMutedForeground: "var(--muted-foreground)",
                colorBackground: "var(--card)",
                colorInput: "var(--muted)",
                colorBorder: "var(--border)",
                colorInputForeground: "var(--foreground)",
                borderRadius: "12px",
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              },
              elements: {
                card: "bg-card text-card-foreground border border-border shadow-2xl rounded-2xl",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 rounded-xl transition-colors w-full",
                formFieldInput:
                  "border border-input bg-muted text-foreground focus:border-ring h-10 px-3 rounded-xl transition-all text-xs",
                formFieldLabel: "text-foreground text-xs font-semibold mb-1.5",
              },
            }}
          >
            {children}
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
