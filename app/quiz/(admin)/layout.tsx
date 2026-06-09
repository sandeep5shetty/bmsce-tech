import Link from "next/link";
import { redirect } from "next/navigation";

import { getUser } from "@/actions/user";

import { QuizSidebarNav } from "@/features/quiz/components/quiz-sidebar-nav";
import { quizApiFetch } from "@/features/quiz/lib/server-fetch";

const SIDEBAR_EVENT_LIMIT = 6;

export default async function QuizAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/quiz");
  }

  let recentEvents: {
    id: string;
    title: string;
    status: string;
    theme_id: string | null;
    custom_theme: unknown;
  }[] = [];
  let totalEventCount = 0;

  try {
    const res = await quizApiFetch("/events");
    if (res.ok) {
      const data = await res.json();
      const events = (data.events ?? []) as typeof recentEvents;
      totalEventCount = events.length;
      recentEvents = events.slice(0, SIDEBAR_EVENT_LIMIT);
    }
  } catch {
    // Sidebar shows empty state when API is unavailable
  }

  return (
    <div className="bg-background flex min-h-[calc(100dvh-8rem)]">
      <aside className="bg-card sticky top-20 flex h-[calc(100dvh-8rem)] w-64 shrink-0 flex-col border-r">
        <div className="flex h-14 shrink-0 items-center border-b px-6">
          <Link
            href="/quiz"
            className="text-primary font-serif text-xl font-semibold tracking-tight"
          >
            Quiz
          </Link>
        </div>

        <QuizSidebarNav
          events={recentEvents.map((e) => ({
            ...e,
            custom_theme: e.custom_theme as import("@/features/quiz/lib/themes").CustomTheme | null,
          }))}
          totalEventCount={totalEventCount}
        />

        <div className="shrink-0 border-t px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              aria-hidden="true"
            >
              {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <p
              className="text-muted-foreground truncate text-sm"
              title={user.email ?? ""}
            >
              {user.name ?? user.email}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-xs hover:underline"
          >
            ← Back to BMSCE Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
