import Link from "next/link";

import { Button } from "@/components/ui/button";

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
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-8 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Quiz Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your quiz events</p>
        </div>
        <Button asChild>
          <Link href="/quiz/events/new">Create Event</Link>
        </Button>
      </div>

      {eventList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">
            📋
          </div>
          <h2 className="font-serif mb-2 text-lg font-semibold">No events yet</h2>
          <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
            Create your first quiz event to get started. You can add questions,
            publish it, and run live sessions.
          </p>
          <Button asChild>
            <Link href="/quiz/events/new">Create your first event</Link>
          </Button>
        </div>
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
