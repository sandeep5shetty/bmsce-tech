"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  QuestionCard,
  type Question,
} from "@/features/quiz/components/question-card";

interface QuestionListProps {
  questions: Question[];
  eventId: string;
}

export function QuestionList({ questions, eventId }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">
          ❓
        </div>
        <h2 className="font-serif mb-2 text-lg font-semibold">No questions yet</h2>
        <p className="text-muted-foreground mx-auto mb-6 max-w-sm text-sm">
          Add your first question to get started. Quiz supports single-select
          and multi-select multiple-choice questions.
        </p>
        <Button asChild>
          <Link href={`/quiz/events/${eventId}/questions/new`}>
            Add your first question
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Questions">
      {questions.map((question) => (
        <li key={question.id}>
          <QuestionCard question={question} eventId={eventId} />
        </li>
      ))}
    </ol>
  );
}
