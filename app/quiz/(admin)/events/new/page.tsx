"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export default function NewQuizEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    general?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};

    if (!title.trim()) {
      next.title = "Title is required.";
    } else if (title.trim().length > 100) {
      next.title = "Title must be 100 characters or fewer.";
    }

    if (description.length > 500) {
      next.description = "Description must be 500 characters or fewer.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/quiz/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        const apiError = body?.error;

        if (apiError?.code === "DUPLICATE_EVENT_TITLE") {
          setErrors({ title: "An event with this title already exists." });
        } else if (apiError?.field === "title") {
          setErrors({ title: apiError.message });
        } else if (apiError?.field === "description") {
          setErrors({ description: apiError.message });
        } else {
          const msg = apiError?.message ?? "Failed to create event.";
          setErrors({ general: msg });
          toast.error(msg);
        }
        return;
      }

      toast.success("Event created", {
        description: `"${body.event.title}" is ready to edit.`,
      });
      router.push(`/quiz/events/${body.event.id}`);
    } catch {
      const msg = "An unexpected error occurred. Please try again.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl px-6">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/quiz">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/quiz"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Create Event</CardTitle>
            <CardDescription>
              Give your quiz event a title and an optional description.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-5">
              {errors.general && (
                <div
                  role="alert"
                  className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm"
                >
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g. Team Trivia Night"
                  maxLength={100}
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-describedby={errors.title ? "title-error" : undefined}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p id="title-error" role="alert" className="text-destructive text-sm">
                    {errors.title}
                  </p>
                )}
                <p className="text-muted-foreground text-right text-xs">
                  {title.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="A short description of your event…"
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-describedby={
                    errors.description ? "description-error" : undefined
                  }
                  aria-invalid={!!errors.description}
                  className="min-h-[80px] resize-none"
                />
                {errors.description && (
                  <p
                    id="description-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.description}
                  </p>
                )}
                <p className="text-muted-foreground text-right text-xs">
                  {description.length}/500
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Spinner size="sm" className="text-primary-foreground" />
                    Creating…
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/quiz">Cancel</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
