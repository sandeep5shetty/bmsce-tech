import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, BarChart2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PastSessions } from "@/features/quiz/components/past-sessions";
import { quizApiFetch } from "@/features/quiz/lib/server-fetch";
import {
  resolveGradient,
  type CustomTheme,
} from "@/features/quiz/lib/themes";

type PageProps = { params: Promise<{ eventId: string }> };

export default async function EventAnalyticsListPage({ params }: PageProps) {
  const { eventId } = await params;

  const eventRes = await quizApiFetch(`/events/${eventId}`);
  if (!eventRes.ok) notFound();
  const { event } = await eventRes.json();

  let endedSessions: { id: string; ended_at: string | null }[] = [];

  try {
    const sessionsRes = await quizApiFetch(`/events/${eventId}/sessions`);
    if (sessionsRes.ok) {
      const sessionsData = await sessionsRes.json();
      endedSessions = (sessionsData.sessions ?? [])
        .filter((s: { status: string }) => s.status === "ended")
        .map((s: { id: string; ended_at: string | null }) => ({
          id: s.id,
          ended_at: s.ended_at,
        }));
    }
  } catch {
    // Sessions list unavailable
  }

  const gradient = resolveGradient({
    themeId: event.theme_id as string | null,
    customTheme: event.custom_theme as CustomTheme | null,
  });

  return (
    <div className="container mx-auto mb-32 max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/quiz/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Link
          href={`/quiz/events/${eventId}`}
          className="text-muted-foreground hover:text-foreground truncate text-sm transition-colors"
        >
          {event.title}
        </Link>
      </div>

      <div
        className="overflow-hidden rounded-2xl shadow-sm"
        style={{ background: gradient }}
      >
        <div className="flex items-center gap-3 px-6 py-6 text-white sm:px-8">
          <BarChart2 className="h-6 w-6 shrink-0 opacity-90" />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold tracking-wide drop-shadow-sm">
              Past Sessions
            </h1>
            <p className="mt-0.5 text-sm text-white/85 drop-shadow-sm">
              View analytics and export results for completed quiz runs.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        {endedSessions.length > 0 ? (
          <PastSessions eventId={eventId} sessions={endedSessions} />
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
            No completed sessions yet. End a live quiz to unlock analytics for
            that run.
          </p>
        )}
      </section>
    </div>
  );
}
