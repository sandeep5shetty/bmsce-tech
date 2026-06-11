"use client";

import { useRef, useState } from "react";

import { Check, FileJson, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ZodError } from "zod";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  bulkCreateQuestionsSchema,
  type CreateQuestionInput,
} from "@/features/quiz/lib/validation";

interface JsonQuestionImporterProps {
  eventId: string;
}

type Step = "form" | "preview";

const SAMPLE_JSON = `{
  "questions": [
    {
      "question_type": "single_select",
      "text": "What is the capital of India?",
      "time_limit": 20,
      "answer_options": [
        { "text": "Mumbai", "is_correct": false },
        { "text": "New Delhi", "is_correct": true },
        { "text": "Kolkata", "is_correct": false },
        { "text": "Chennai", "is_correct": false }
      ]
    },
    {
      "question_type": "multi_select",
      "text": "Which are JavaScript frameworks?",
      "time_limit": 30,
      "answer_options": [
        { "text": "React", "is_correct": true },
        { "text": "Django", "is_correct": false },
        { "text": "Vue", "is_correct": true },
        { "text": "Laravel", "is_correct": false }
      ]
    },
    {
      "question_type": "open_text",
      "text": "Name one sorting algorithm.",
      "time_limit": 30
    },
    {
      "question_type": "rating_scale",
      "text": "How would you rate this session?",
      "time_limit": 15,
      "rating_min": 1,
      "rating_max": 5
    }
  ]
}`;

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_select: "Single select",
  multi_select: "Multi select",
  open_text: "Open text",
  rating_scale: "Rating scale",
  image_choice: "Image choice",
};

function normalizeImportPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return { questions: raw };
  }
  return raw;
}

function formatValidationError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid JSON format.";
  const path =
    issue.path.length > 0
      ? ` (${issue.path.map(String).join(".")})`
      : "";
  return `${issue.message}${path}`;
}

function prepareQuestionsForApi(
  questions: CreateQuestionInput[],
): CreateQuestionInput[] {
  return questions.map((q) => ({
    ...q,
    answer_options: q.answer_options?.map((opt, idx) => ({
      ...opt,
      position: opt.position ?? idx + 1,
    })),
  }));
}

export function JsonQuestionImporter({ eventId }: JsonQuestionImporterProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<CreateQuestionInput[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  function resetState() {
    setStep("form");
    setJsonText("");
    setParseError(null);
    setParsed([]);
    setSelected(new Set());
    setSaving(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  }

  function handleLoadSample() {
    setJsonText(SAMPLE_JSON);
    setParseError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      toast.error("Please upload a .json file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(String(reader.result ?? ""));
      setParseError(null);
    };
    reader.onerror = () => {
      toast.error("Failed to read the file.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleParse(e: React.FormEvent) {
    e.preventDefault();
    setParseError(null);

    const trimmed = jsonText.trim();
    if (!trimmed) {
      setParseError("Paste JSON or upload a file.");
      return;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      setParseError("Invalid JSON syntax. Check brackets, commas, and quotes.");
      return;
    }

    const normalized = normalizeImportPayload(raw);
    const result = bulkCreateQuestionsSchema.safeParse(normalized);
    if (!result.success) {
      setParseError(formatValidationError(result.error));
      return;
    }

    const questions = result.data.questions;
    setParsed(questions);
    setSelected(new Set(questions.map((_, idx) => idx)));
    setStep("preview");
    toast.success(`Parsed ${questions.length} questions`);
  }

  function toggleSelected(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleImportSelected() {
    const toAdd = parsed.filter((_, idx) => selected.has(idx));
    if (toAdd.length === 0) {
      toast.error("Select at least one question to import.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/questions/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: prepareQuestionsForApi(toAdd),
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to import questions.");
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
          <FileJson className="mr-1.5 h-4 w-4" />
          Import JSON
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Import Questions from JSON</DialogTitle>
          <DialogDescription>
            Upload or paste a JSON file with questions, answer options, and
            settings. Review before adding them to this event.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleParse} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Upload .json
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
              >
                Load sample
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-import">JSON</Label>
              <Textarea
                id="json-import"
                placeholder='{ "questions": [ { "question_type": "single_select", ... } ] }'
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setParseError(null);
                }}
                rows={14}
                className="font-mono text-xs"
                spellCheck={false}
              />
            </div>

            <div className="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-xs leading-relaxed">
              <p className="text-foreground mb-1 font-medium">Supported fields</p>
              <p>
                <code className="text-foreground">question_type</code>:{" "}
                single_select, multi_select, open_text, rating_scale, image_choice
              </p>
              <p>
                <code className="text-foreground">text</code>,{" "}
                <code className="text-foreground">time_limit</code> (5–120s),{" "}
                <code className="text-foreground">image_url</code>
              </p>
              <p>
                Choice questions:{" "}
                <code className="text-foreground">answer_options</code> with{" "}
                <code className="text-foreground">text</code>,{" "}
                <code className="text-foreground">is_correct</code>
              </p>
              <p>
                Rating scale:{" "}
                <code className="text-foreground">rating_min</code>,{" "}
                <code className="text-foreground">rating_max</code>
              </p>
              <p className="mt-1">Up to 50 questions per import.</p>
            </div>

            {parseError ? (
              <p role="alert" className="text-destructive text-sm">
                {parseError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <FileJson className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {selected.size} of {parsed.length} selected
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("form")}
              >
                ← Back to JSON
              </Button>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {parsed.map((question, index) => {
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
                              {QUESTION_TYPE_LABELS[question.question_type] ??
                                question.question_type}
                            </Badge>
                            {question.time_limit != null ? (
                              <Badge variant="outline" className="text-xs">
                                {question.time_limit}s
                              </Badge>
                            ) : null}
                            {question.question_type === "rating_scale" ? (
                              <Badge variant="outline" className="text-xs">
                                {question.rating_min}–{question.rating_max}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm font-medium">{question.text}</p>
                          {question.answer_options &&
                          question.answer_options.length > 0 ? (
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
                                  {opt.text ?? "(image option)"}
                                  {opt.is_correct ? " ✓" : ""}
                                </li>
                              ))}
                            </ul>
                          ) : null}
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
                onClick={handleImportSelected}
                disabled={saving || selected.size === 0}
                className="site-theme"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>Import {selected.size} question{selected.size !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
