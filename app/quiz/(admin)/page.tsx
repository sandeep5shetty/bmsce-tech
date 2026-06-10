import Link from "next/link";

import { Button } from "@/components/ui/button";

import { EmptyAddCard } from "@/components/common/empty-add-card";
import { EventCard } from "@/features/quiz/components/event-card";
import { quizApiFetch } from "@/features/quiz/lib/server-fetch";

export default async function QuizDashboardPage() {
  let eventList: Parameters<typeof EventCard>[0]["event"][] = [];

  try {
    const res = await quizApiFetch("/events");
    if (res.ok) {
      const data = await res.json();
      eventList = data.events ?? [];
    }
  } catch {
    eventList = [];
  }

  return (
    <div className="container mx-auto mt-6 mb-32 max-w-6xl space-y-8 px-4 sm:mt-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Quiz Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your quiz events</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/quiz/events/new">Create Event</Link>
        </Button>
      </div>

      {eventList.length === 0 ? (
        <EmptyAddCard
          title="Create your first event"
          description="Add questions, publish your quiz, and run live sessions with your class."
          href="/quiz/events/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventList.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
