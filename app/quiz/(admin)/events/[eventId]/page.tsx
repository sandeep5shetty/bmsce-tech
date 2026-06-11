import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PastSessions } from "@/features/quiz/components/past-sessions";
import { AiQuestionGenerator } from "@/features/quiz/components/ai-question-generator";
import { JsonQuestionImporter } from "@/features/quiz/components/json-question-importer";
import { PublishPanel } from "@/features/quiz/components/publish-panel";
import { QuestionList } from "@/features/quiz/components/question-list";
import type { Question } from "@/features/quiz/components/question-card";
import { quizApiFetch } from "@/features/quiz/lib/server-fetch";
import {
  resolveGradient,
  type CustomTheme,
} from "@/features/quiz/lib/themes";

type PageProps = { params: Promise<{ eventId: string }> };

export default async function QuizEventPage({ params }: PageProps) {
  const { eventId } = await params;

  const eventRes = await quizApiFetch(`/events/${eventId}`);
  if (!eventRes.ok) notFound();
  const { event } = await eventRes.json();

  const questionsRes = await quizApiFetch(`/events/${eventId}/questions`);
  const questionsBody = questionsRes.ok ? await questionsRes.json() : { questions: [] };
  const questionList = (questionsBody.questions ?? []) as Question[];

  let activeSessionId: string | null = null;
  let endedSessions: { id: string; ended_at: string | null }[] = [];

  try {
    const sessionsRes = await quizApiFetch(`/events/${eventId}/sessions`);
    if (sessionsRes.ok) {
      const sessionsData = await sessionsRes.json();
      const sessions = sessionsData.sessions ?? [];
      const active = sessions.find(
        (s: { status: string }) => s.status !== "ended",
      );
      activeSessionId = active?.id ?? null;
      endedSessions = sessions
        .filter((s: { status: string }) => s.status === "ended")
        .slice(0, 5);
    }
  } catch {
    // Sessions endpoint may not exist yet
  }

  const themeInput = {
    themeId: event.theme_id as string | null,
    customTheme: event.custom_theme as CustomTheme | null,
  };
  const gradient = resolveGradient(themeInput);

  return (
    <div className="container mx-auto mt-6 mb-32 max-w-6xl space-y-6 px-4 sm:mt-8 sm:px-6">
      <div>
        <Link
          href="/quiz"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl shadow-sm" style={{ background: gradient }}>
        <div className="flex items-start justify-between gap-4 px-6 py-7 text-white sm:px-8">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-3">
              <h1 className="font-serif truncate text-2xl font-bold tracking-tight drop-shadow-sm sm:text-3xl">
                {event.title}
              </h1>
              <StatusBadge status={event.status} />
            </div>
            {event.description && (
              <p className="line-clamp-2 text-sm text-white/90 drop-shadow-sm sm:text-base">
                {event.description}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 bg-white/15 text-white hover:bg-white/25"
            asChild
          >
            <Link href={`/quiz/events/${eventId}/edit`}>Edit Event</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="lg:sticky lg:top-24">
          <PublishPanel
            eventId={eventId}
            status={event.status}
            joinCode={event.join_code ?? null}
            activeSessionId={activeSessionId}
          />
        </aside>

        <div className="min-w-0 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-lg font-semibold">
                Questions
                {questionList.length > 0 && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    ({questionList.length})
                  </span>
                )}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <AiQuestionGenerator eventId={eventId} />
                <JsonQuestionImporter eventId={eventId} />
                <Button size="sm" asChild>
                  <Link href={`/quiz/events/${eventId}/questions/new`}>
                    Add Question
                  </Link>
                </Button>
              </div>
            </div>

            <QuestionList questions={questionList} eventId={eventId} />
          </section>

          {endedSessions.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-serif text-lg font-semibold">Past Sessions</h2>
              <PastSessions eventId={eventId} sessions={endedSessions} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <Badge className="shrink-0 bg-white/95 text-green-800 shadow-sm">
        Published
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="shrink-0 bg-white/95 text-gray-700 shadow-sm">
      Draft
    </Badge>
  );
}
