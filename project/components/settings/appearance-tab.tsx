"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Palette, Sun, Moon, Laptop } from "lucide-react";

export function AppearanceTab() {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(
    "system",
  );

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const stored = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    if (stored) setThemeState(stored);
    else setThemeState(isDark ? "dark" : "light");
  }, []);

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (systemDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-primary" />
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Appearance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize how NovaBoard looks on your device.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          onClick={() => handleThemeChange("light")}
          className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            theme === "light"
              ? "border-primary bg-primary/5 text-primary font-semibold shadow-2xs"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
          }`}
        >
          <Sun size={20} />
          <span className="text-xs">Light</span>
        </button>

        <button
          type="button"
          onClick={() => handleThemeChange("dark")}
          className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            theme === "dark"
              ? "border-primary bg-primary/5 text-primary font-semibold shadow-2xs"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
          }`}
        >
          <Moon size={20} />
          <span className="text-xs">Dark</span>
        </button>

        <button
          type="button"
          onClick={() => handleThemeChange("system")}
          className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            theme === "system"
              ? "border-primary bg-primary/5 text-primary font-semibold shadow-2xs"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
          }`}
        >
          <Laptop size={20} />
          <span className="text-xs">System</span>
        </button>
      </div>
    </div>
  );
}
