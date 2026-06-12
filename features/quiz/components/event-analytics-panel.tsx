import Link from "next/link";

import { BarChart2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventAnalyticsPanelProps {
  eventId: string;
  latestEndedSessionId: string | null;
  endedSessionCount: number;
}

export function EventAnalyticsPanel({
  eventId,
  latestEndedSessionId,
  endedSessionCount,
}: EventAnalyticsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg">Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {latestEndedSessionId ? (
          <>
            <p className="text-muted-foreground text-sm">
              {endedSessionCount === 1
                ? "1 completed session with analytics available."
                : `${endedSessionCount} completed sessions. View stats, scores, and export CSV.`}
            </p>
            <Button asChild className="site-theme w-full">
              <Link href={`/quiz/events/${eventId}/analytics`}>
                <BarChart2 className="h-4 w-4" />
                View Past Sessions
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Start a live session, run your quiz, then end the session. Analytics
            with scores and per-question breakdowns will appear here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
