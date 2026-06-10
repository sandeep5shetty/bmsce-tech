"use client";

import { useState } from "react";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

export type QuestionType =
  | "single_select"
  | "multi_select"
  | "open_text"
  | "rating_scale"
  | "image_choice";

export interface AnswerOption {
  id: string;
  question_id: string;
  position: number;
  text: string | null;
  image_url: string | null;
  is_correct: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  event_id: string;
  position: number;
  question_type: QuestionType;
  text: string;
  image_url: string | null;
  time_limit: number;
  rating_min: number | null;
  rating_max: number | null;
  created_at: string;
  updated_at: string;
  answer_options: AnswerOption[];
}

interface QuestionCardProps {
  question: Question;
  eventId: string;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_select: "Single Select",
  multi_select: "Multi Select",
  open_text: "Open Text",
  rating_scale: "Rating Scale",
  image_choice: "Image Choice",
};

const QUESTION_TYPE_VARIANTS: Record<
  QuestionType,
  "default" | "secondary" | "outline" | "destructive"
> = {
  single_select: "default",
  multi_select: "secondary",
  open_text: "outline",
  rating_scale: "secondary",
  image_choice: "outline",
};

export function QuestionCard({ question, eventId }: QuestionCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/questions/${question.id}`,
        { method: "DELETE" },
      );

      if (res.status === 204) {
        toast.success("Question deleted");
        setDeleteConfirmOpen(false);
        router.refresh();
        return;
      }

      const body = await res.json();
      toast.error(body?.error?.message ?? "Failed to delete question.");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  const typeLabel = QUESTION_TYPE_LABELS[question.question_type];
  const typeVariant = QUESTION_TYPE_VARIANTS[question.question_type];

  return (
    <>
      <ConfirmActionDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete question?"
        description="This question will be permanently removed from the event. This action cannot be undone."
        confirmLabel="Delete Question"
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />
      <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="bg-muted text-muted-foreground mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            aria-label={`Question ${question.position}`}
          >
            {question.position}
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-2 line-clamp-2 text-sm leading-snug font-medium">
              {question.text}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={typeVariant}>{typeLabel}</Badge>

              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {question.time_limit}s
              </span>

              {question.answer_options.length > 0 && (
                <span className="text-muted-foreground text-xs">
                  {question.answer_options.length} option
                  {question.answer_options.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="icon-sm" asChild>
              <Link
                href={`/quiz/events/${eventId}/questions/${question.id}`}
                aria-label={`Edit question: ${question.text}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting}
              aria-label={`Delete question: ${question.text}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
