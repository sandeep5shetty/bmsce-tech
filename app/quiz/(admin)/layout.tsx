import { redirect } from "next/navigation";

import { QuizAdminShell } from "@/features/quiz/components/quiz-admin-shell";
import { canManageQuiz } from "@/features/quiz/lib/auth";
import { quizApiFetch } from "@/features/quiz/lib/server-fetch";

import { getUser } from "@/actions/user";

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

  if (!canManageQuiz(user.email)) {
    redirect("/quiz/join");
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
    <QuizAdminShell
      events={recentEvents.map((e) => ({
        ...e,
        custom_theme: e.custom_theme as import("@/features/quiz/lib/themes").CustomTheme | null,
      }))}
      totalEventCount={totalEventCount}
    >
      {children}
    </QuizAdminShell>
  );
}
