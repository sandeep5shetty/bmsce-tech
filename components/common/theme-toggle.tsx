"use client";

import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

import Moon from "../icons/moon";
import Sun from "../icons/sun";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    // Check if View Transition API is supported
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // Use View Transition API with proper type casting
      const doc = document as Document & {
        startViewTransition: (callback: () => void) => void;
      };
      doc.startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      // Fallback for browsers that don't support View Transitions
      setTheme(newTheme);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="text-muted-foreground hidden size-5 dark:block" />
      <Moon className="text-muted-foreground block size-5 dark:hidden" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
