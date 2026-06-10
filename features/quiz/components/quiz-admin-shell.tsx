"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Menu, SidebarClose } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

import type { CustomTheme } from "@/features/quiz/lib/themes";

import { QuizSidebarNav } from "./quiz-sidebar-nav";

export const QUIZ_ADMIN_TOOLBAR_SLOT_ID = "quiz-admin-toolbar-slot";

type SidebarEvent = {
  id: string;
  title: string;
  status: string;
  theme_id: string | null;
  custom_theme: CustomTheme | null;
};

interface QuizAdminShellProps {
  events: SidebarEvent[];
  totalEventCount: number;
  children: React.ReactNode;
}

function QuizSidebarPanel({
  events,
  totalEventCount,
  onNavigate,
}: {
  events: SidebarEvent[];
  totalEventCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b px-6">
        <Link
          href="/quiz"
          onClick={onNavigate}
          className="text-primary font-serif text-xl font-semibold tracking-tight"
        >
          Quiz
        </Link>
      </div>

      <QuizSidebarNav
        events={events}
        totalEventCount={totalEventCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function QuizAdminShell({
  events,
  totalEventCount,
  children,
}: QuizAdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-background flex min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-8rem)] lg:mt-5">
      <aside
        className={cn(
          "bg-card sticky top-16 hidden h-[calc(100dvh-5rem)] shrink-0 flex-col border-r transition-[width] duration-300 md:top-20 md:flex md:h-[calc(100dvh-8rem)]",
          collapsed ? "w-0 overflow-hidden border-r-0" : "w-64",
        )}
      >
        <QuizSidebarPanel events={events} totalEventCount={totalEventCount} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100%,18rem)] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Quiz navigation</SheetTitle>
            <SheetDescription>Quiz section menu</SheetDescription>
          </SheetHeader>
          <QuizSidebarPanel
            events={events}
            totalEventCount={totalEventCount}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-card/80 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 backdrop-blur-sm md:h-14 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open quiz menu"
            >
              <Menu className="text-muted-foreground size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand quiz sidebar" : "Collapse quiz sidebar"}
            >
              {collapsed ? (
                <Menu className="text-muted-foreground size-5" />
              ) : (
                <SidebarClose className="text-muted-foreground size-5" />
              )}
            </Button>

            <Link
              href="/quiz"
              className="text-primary font-serif text-lg font-semibold tracking-tight md:hidden"
            >
              Quiz
            </Link>
          </div>

          <div
            id={QUIZ_ADMIN_TOOLBAR_SLOT_ID}
            className="site-theme flex min-w-0 items-center justify-end gap-2"
          />
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
