"use client";

import { MessageSquareText, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface SessionReportFeedbackEntry {
  id: string;
  display_name: string;
  is_anonymous: boolean;
  rating: number;
  feedback_text: string;
  submitted_at: string;
  participant_id: string | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3.5 w-3.5",
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export function SessionReportFeedbackPanel({
  feedback,
}: {
  feedback: SessionReportFeedbackEntry[];
}) {
  const avg =
    feedback.length > 0
      ? (
          feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        ).toFixed(1)
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 font-serif text-lg">
          <MessageSquareText className="h-5 w-5" />
          Report feedback
          {feedback.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {feedback.length} response{feedback.length === 1 ? "" : "s"}
            </Badge>
          )}
          {avg !== null && (
            <span className="text-muted-foreground flex items-center gap-1 text-sm font-normal">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avg} avg
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No feedback yet. Participants can submit ratings and comments from
            their post-quiz report page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="min-w-[200px]">Feedback</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.display_name}
                      {row.is_anonymous && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Anonymous
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stars rating={row.rating} />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-md text-sm whitespace-pre-wrap">
                      {row.feedback_text}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(row.submitted_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
