"use client";

import { useCallback, useEffect, useState } from "react";

import { BookOpen, Check, Loader2, Sparkles } from "lucide-react";
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

import type { QuizMaterialSummary } from "@/features/quiz/components/quiz-materials-panel";
import type { AiGeneratedQuestion } from "@/features/quiz/lib/validation";
import { cn } from "@/lib/utils";

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
  const [useMaterials, setUseMaterials] = useState(false);
  const [materials, setMaterials] = useState<QuizMaterialSummary[]>([]);
  const [materialIds, setMaterialIds] = useState<Set<string>>(new Set());
  const [lastSourceChunks, setLastSourceChunks] = useState<number | null>(null);

  const loadMaterials = useCallback(async () => {
    const res = await fetch(`/api/quiz/v1/events/${eventId}/materials`);
    if (!res.ok) return;
    const data = (await res.json()) as { materials?: QuizMaterialSummary[] };
    const ready = (data.materials ?? []).filter((m) => m.status === "ready");
    setMaterials(ready);
    setMaterialIds(new Set(ready.map((m) => m.id)));
  }, [eventId]);

  useEffect(() => {
    if (open) void loadMaterials();
  }, [open, loadMaterials]);

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

    if (useMaterials && materialIds.size === 0) {
      toast.error("Select at least one indexed material or turn off grounded mode.");
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
            use_materials: useMaterials,
            material_ids: useMaterials ? [...materialIds] : undefined,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to generate questions.");
        return;
      }

      const questions = (data.questions ?? []) as AiGeneratedQuestion[];
      const requested =
        typeof data.requested_count === "number" ? data.requested_count : count;
      const partial = data.partial === true || questions.length < requested;

      const sourceChunks =
        typeof data.source_chunks === "number" ? data.source_chunks : null;
      setLastSourceChunks(sourceChunks);

      setGenerated(questions);
      setSelected(new Set(questions.map((_, idx) => idx)));
      setStep("preview");
      if (partial && useMaterials) {
        toast.message(
          `Generated ${questions.length} of ${requested} grounded questions.`,
          {
            description:
              sourceChunks != null
                ? `Used ${sourceChunks} text section${sourceChunks === 1 ? "" : "s"} from your file. Try a broader topic, a longer document, or generate again.`
                : "Try a broader topic or add more pages to your document.",
          },
        );
      } else if (partial) {
        toast.success(`Generated ${questions.length} of ${requested} questions.`);
      } else {
        toast.success(`Generated ${questions.length} questions`);
      }
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
          source_citations: q.citations?.map((c) => ({
            material_id: c.material_id,
            chunk_id: c.chunk_id,
            file_name: c.file_name,
            page_number: c.page_number,
            slide_number: c.slide_number,
            excerpt: c.excerpt,
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

      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Generate Questions with AI</DialogTitle>
          <DialogDescription>
            Describe your topic and settings. Review generated questions before
            adding them to this event.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form
            onSubmit={handleGenerate}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5"
          >
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

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Use uploaded materials</p>
                  <p className="text-muted-foreground text-xs">
                    Ground questions in your course files with citations.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useMaterials}
                  onClick={() => setUseMaterials(!useMaterials)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                    useMaterials ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                      useMaterials ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </div>
              {useMaterials && (
                <div className="space-y-2">
                  {materials.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No indexed materials yet. Use the Materials button on this
                      event to upload files first.
                    </p>
                  ) : (
                    <ul className="max-h-32 space-y-1 overflow-y-auto">
                      {materials.map((material) => {
                        const checked = materialIds.has(material.id);
                        return (
                          <li key={material.id}>
                            <label className="flex cursor-pointer items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setMaterialIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(material.id)) {
                                      next.delete(material.id);
                                    } else {
                                      next.add(material.id);
                                    }
                                    return next;
                                  });
                                }}
                              />
                              <span className="truncate">{material.file_name}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-context">Additional context (optional)</Label>
              <Textarea
                id="ai-context"
                placeholder="e.g. keep all options similar length; avoid longest answer as correct; audience level…"
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
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {selected.size} of {generated.length} selected
                {generated.length < count && (
                  <span className="text-muted-foreground/80">
                    {" "}
                    (asked for {count}
                    {useMaterials ? " from materials" : ""}
                    {lastSourceChunks != null
                      ? ` · ${lastSourceChunks} source section${lastSourceChunks === 1 ? "" : "s"}`
                      : ""}
                    )
                  </span>
                )}
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

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-1 py-1">
              {generated.map((question, index) => {
                const isSelected = selected.has(index);
                return (
                  <Card
                    key={index}
                    className={cn(
                      "cursor-pointer shadow-sm transition-all",
                      isSelected
                        ? "border-primary border-2 bg-card"
                        : "border-border border opacity-90 hover:opacity-100",
                    )}
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
                          {question.citations && question.citations.length > 0 && (
                            <div className="space-y-1 rounded-md border bg-muted/30 p-2">
                              <p className="flex items-center gap-1 text-xs font-medium">
                                <BookOpen className="h-3 w-3" />
                                Sources
                              </p>
                              {question.citations.map((citation, citIdx) => (
                                <p
                                  key={citIdx}
                                  className="text-muted-foreground text-xs leading-relaxed"
                                >
                                  <span className="font-medium text-foreground">
                                    {citation.file_name}
                                  </span>
                                  {citation.page_number != null
                                    ? ` · p. ${citation.page_number}`
                                    : citation.slide_number != null
                                      ? ` · slide ${citation.slide_number}`
                                      : ""}
                                  {" — "}
                                  {citation.excerpt}
                                </p>
                              ))}
                            </div>
                          )}
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

            <div className="flex shrink-0 justify-end gap-2 border-t pt-4">
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
