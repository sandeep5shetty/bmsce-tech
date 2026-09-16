"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Star,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ReportFeedbackDialogProps {
  sessionId: string;
  participantToken: string;
  defaultDisplayName: string;
}

interface FeedbackState {
  submitted: boolean;
  rating?: number;
  feedback_text?: string;
  is_anonymous?: boolean;
  display_name?: string | null;
}

function AnonymousToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">Submit anonymously</p>
        <p className="text-muted-foreground text-xs">
          Your name will not be shown to organizers.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Submit anonymously"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
          checked
            ? "bg-primary focus-visible:outline-primary"
            : "bg-input focus-visible:outline-ring",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className="rounded p-0.5 transition-colors disabled:opacity-50"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              className={cn(
                "h-7 w-7",
                active
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
      <span className="text-muted-foreground ml-2 text-sm tabular-nums">
        {value > 0 ? `${value}/5` : "Select rating"}
      </span>
    </div>
  );
}

export function ReportFeedbackDialog({
  sessionId,
  participantToken,
  defaultDisplayName,
}: ReportFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<FeedbackState | null>(null);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const loadFeedback = useCallback(async () => {
    const res = await fetch(
      `/api/quiz/v1/sessions/${sessionId}/report/feedback`,
      { headers: { Authorization: `Bearer ${participantToken}` } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { feedback: FeedbackState };
    return data.feedback;
  }, [sessionId, participantToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feedback = await loadFeedback();
        if (!cancelled && feedback) setExisting(feedback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFeedback]);

  useEffect(() => {
    setDisplayName(defaultDisplayName);
  }, [defaultDisplayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/quiz/v1/sessions/${sessionId}/report/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${participantToken}`,
          },
          body: JSON.stringify({
            is_anonymous: isAnonymous,
            display_name: isAnonymous ? undefined : displayName.trim(),
            rating,
            feedback_text: feedbackText.trim(),
          }),
        },
      );
      const data = (await res.json()) as {
        feedback?: FeedbackState;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Could not submit feedback.");
      }
      if (data.feedback) setExisting(data.feedback);
      toast.success("Thanks for your feedback!");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not submit feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = existing?.submitted === true;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 rounded-xl border border-primary bg-primary/10 px-6 py-3 text-center text-sm font-bold text-primary hover:bg-primary/15 transition"
        disabled={loading}
        onClick={() => setOpen(true)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <MessageSquareText className="mr-1.5 h-4 w-4" />
            {submitted ? "Feedback sent" : "Give feedback"}
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="text-primary h-5 w-5" />
              Share your feedback
            </DialogTitle>
            <DialogDescription>
              Tell us how the quiz and report worked for you. 
            </DialogDescription>
          </DialogHeader>

          {submitted && existing ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Thanks — your feedback was recorded.
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-4 w-4",
                      s <= (existing.rating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground",
                    )}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {existing.feedback_text}
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="feedback-name"
                  className="flex items-center gap-1.5"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Your name
                </Label>
                <Input
                  id="feedback-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isAnonymous || submitting}
                  placeholder="How should we show your name?"
                  maxLength={30}
                />
                <AnonymousToggle
                  checked={isAnonymous}
                  onChange={setIsAnonymous}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" />
                  Rating
                </Label>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-text">Your feedback</Label>
                <Textarea
                  id="feedback-text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={submitting}
                  placeholder="What did you think of the quiz and report?"
                  maxLength={1000}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Submit feedback"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
