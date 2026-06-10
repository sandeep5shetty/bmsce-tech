"use client";

import { useState } from "react";

import { Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { AiGeneratedQuestion } from "@/features/quiz/lib/validation";

interface AiQuestionGeneratorProps {
  eventId: string;
}

type Step = "form" | "preview";

export function AiQuestionGenerator({ eventId }: AiQuestionGeneratorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [questionType, setQuestionType] = useState<
    "single_select" | "multi_select"
  >("single_select");
  const [timeLimit, setTimeLimit] = useState(20);
  const [additionalContext, setAdditionalContext] = useState("");

  const [generated, setGenerated] = useState<AiGeneratedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function resetState() {
    setStep("form");
    setGenerating(false);
    setSaving(false);
    setGenerated([]);
    setSelected(new Set());
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 2) {
      toast.error("Please enter a topic.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/generate-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: trimmedTopic,
            count,
            difficulty,
            question_type: questionType,
            time_limit: timeLimit,
            additional_context: additionalContext.trim() || undefined,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to generate questions.");
        return;
      }

      const questions = (data.questions ?? []) as AiGeneratedQuestion[];
      setGenerated(questions);
      setSelected(new Set(questions.map((_, idx) => idx)));
      setStep("preview");
      toast.success(`Generated ${questions.length} questions`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleSelected(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleAddSelected() {
    const toAdd = generated.filter((_, idx) => selected.has(idx));
    if (toAdd.length === 0) {
      toast.error("Select at least one question to add.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        questions: toAdd.map((q) => ({
          question_type: q.question_type,
          text: q.text,
          time_limit: q.time_limit ?? timeLimit,
          answer_options: q.answer_options.map((opt, idx) => ({
            text: opt.text,
            is_correct: opt.is_correct,
            position: idx + 1,
          })),
        })),
      };

      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/questions/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to add questions.");
        return;
      }

      toast.success(`Added ${data.count ?? toAdd.length} questions`);
      handleOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="mr-1.5 h-4 w-4" />
          Generate with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Generate Questions with AI</DialogTitle>
          <DialogDescription>
            Describe your topic and settings. Review generated questions before
            adding them to this event.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-topic">Topic</Label>
              <Input
                id="ai-topic"
                placeholder="e.g. Data Structures, Indian History, React hooks"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ai-count">Number of questions</Label>
                <Input
                  id="ai-count"
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-time">Time limit (seconds)</Label>
                <Input
                  id="ai-time"
                  type="number"
                  min={5}
                  max={120}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) =>
                    setDifficulty(v as "easy" | "medium" | "hard")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question type</Label>
                <Select
                  value={questionType}
                  onValueChange={(v) =>
                    setQuestionType(v as "single_select" | "multi_select")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_select">Single select</SelectItem>
                    <SelectItem value="multi_select">Multi select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-context">Additional context (optional)</Label>
              <Textarea
                id="ai-context"
                placeholder="Audience level, syllabus unit, avoid trick questions, etc."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {selected.size} of {generated.length} selected
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("form")}
              >
                ← Back to settings
              </Button>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {generated.map((question, index) => {
                const isSelected = selected.has(index);
                return (
                  <Card
                    key={index}
                    className={`cursor-pointer transition ${
                      isSelected ? "ring-primary ring-2" : "opacity-80"
                    }`}
                    onClick={() => toggleSelected(index)}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground text-xs font-medium">
                              Q{index + 1}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {question.question_type === "single_select"
                                ? "Single select"
                                : "Multi select"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {question.time_limit ?? timeLimit}s
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{question.text}</p>
                          <ul className="space-y-1">
                            {question.answer_options.map((opt, optIdx) => (
                              <li
                                key={optIdx}
                                className={`rounded-md px-2 py-1 text-xs ${
                                  opt.is_correct
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                    : "bg-muted/50 text-muted-foreground"
                                }`}
                              >
                                {opt.text}
                                {opt.is_correct ? " ✓" : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddSelected}
                disabled={saving || selected.size === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  `Add ${selected.size} question${selected.size === 1 ? "" : "s"}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
