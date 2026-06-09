"use client";

import { LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  resolveGradient,
  type CustomTheme,
} from "@/features/quiz/lib/themes";

type SidebarEvent = {
  id: string;
  title: string;
  status: "draft" | "published" | string;
  theme_id: string | null;
  custom_theme: CustomTheme | null;
};

interface QuizSidebarNavProps {
  events: SidebarEvent[];
  totalEventCount: number;
}

export function QuizSidebarNav({
  events,
  totalEventCount,
}: QuizSidebarNavProps) {
  const pathname = usePathname() ?? "";
  const isDashboardActive =
    pathname === "/quiz" || pathname === "/quiz/";

  return (
    <nav
      className="flex-1 space-y-6 overflow-y-auto px-4 py-6"
      aria-label="Quiz navigation"
    >
      <div className="space-y-1">
        <Link
          href="/quiz"
          aria-current={isDashboardActive ? "page" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            isDashboardActive
              ? "bg-accent text-accent-foreground"
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-3">
          <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Events
          </h2>
          <Link
            href="/quiz/events/new"
            aria-label="Create new event"
            title="Create new event"
            className="text-muted-foreground hover:text-foreground hover:bg-accent -mr-1 rounded p-0.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-muted-foreground px-3 text-xs">
            No events yet.{" "}
            <Link href="/quiz/events/new" className="text-primary hover:underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-0.5">
            {events.map((event) => {
              const href = `/quiz/events/${event.id}`;
              const isActive = pathname.startsWith(href);
              const gradient = resolveGradient({
                themeId: event.theme_id,
                customTheme: event.custom_theme,
              });
              return (
                <li key={event.id}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    title={event.title}
                    className={`group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5"
                      style={{ background: gradient }}
                    />
                    <span className="flex-1 truncate">{event.title}</span>
                    {event.status === "published" && (
                      <span
                        aria-label="Published"
                        title="Published"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalEventCount > events.length && (
          <Link
            href="/quiz"
            className="text-muted-foreground hover:text-foreground block px-3 py-1 text-xs transition-colors"
          >
            Show all ({totalEventCount}) →
          </Link>
        )}
      </div>
    </nav>
  );
}
