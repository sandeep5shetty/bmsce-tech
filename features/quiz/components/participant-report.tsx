"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileDown,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFeedbackDialog } from "@/features/quiz/components/report-feedback-form";
import { QuizAvatar } from "@/features/quiz/components/quiz-avatar";
import { DEFAULT_QUIZ_AVATAR } from "@/features/quiz/lib/quiz-avatars";

export interface ParticipantReportPayload {
  report: {
    session_id: string;
    participant_id: string;
    display_name: string;
    avatar: string;
    event_title: string;
    total_score: number;
    rank: number | null;
    participant_count: number;
    percentile: number;
    scored_question_count: number;
    answered_scored_count: number;
    correct_scored_count: number;
    accuracy_percent: number | null;
    skipped_scored_count: number;
    unscored_question_count: number;
    answered_unscored_count: number;
    avg_response_time_ms: number | null;
    cohort_avg_response_time_ms: number | null;
    response_time_vs_cohort: string;
    type_performance: Array<{
      question_type: string;
      answered: number;
      correct: number;
      accuracy_percent: number | null;
    }>;
    strengths: string[];
    improvements: string[];
    question_review: Array<{
      question_id: string;
      position: number;
      text: string;
      question_type: string;
      outcome: string;
      score_awarded: number;
      response_time_ms: number | null;
      cohort_avg_response_time_ms: number | null;
      your_answer_label: string | null;
      correct_answer_label: string | null;
    }>;
  };
  ai: {
    status: string;
    feedback: {
      summary: string;
      strengths: string[];
      improvement_areas: string[];
      prioritized_actions: string[];
    } | null;
    error: string | null;
  };
  pdf?: {
    status: string;
    content_hash: string | null;
    error: string | null;
    download_path: string | null;
  };
}

function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function outcomeBadge(outcome: string) {
  switch (outcome) {
    case "correct":
      return (
        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Correct
        </Badge>
      );
    case "incorrect":
      return (
        <Badge variant="destructive" className="bg-destructive/15 text-destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Incorrect
        </Badge>
      );
    case "skipped":
      return <Badge variant="secondary">Skipped</Badge>;
    default:
      return <Badge variant="outline">Unscored</Badge>;
  }
}

interface ParticipantReportViewProps {
  sessionId: string;
  participantToken: string;
  initialPayload?: ParticipantReportPayload | null;
}

export function ParticipantReportView({
  sessionId,
  participantToken,
  initialPayload = null,
}: ParticipantReportViewProps) {
  const [payload, setPayload] = useState<ParticipantReportPayload | null>(
    initialPayload,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialPayload);
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const aiAutoRequestedRef = useRef(false);

  const fetchReport = useCallback(async () => {
    const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/report`, {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    const data = (await res.json()) as ParticipantReportPayload & {
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message ?? "Could not load your report.");
    }
    return data;
  }, [sessionId, participantToken]);

  useEffect(() => {
    if (initialPayload) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchReport();
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load report.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchReport, initialPayload]);

  const requestAiFeedback = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${participantToken}` },
      });
      const data = (await res.json()) as ParticipantReportPayload & {
        error?: { message?: string };
      };
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error?.message ?? "Could not generate feedback.");
      }
      setPayload(data);
      if (data.ai.status === "generating" || res.status === 202) {
        const retry = await fetchReport();
        setPayload(retry);
      }
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Failed to generate AI feedback.",
      );
    } finally {
      setAiLoading(false);
    }
  }, [sessionId, participantToken, fetchReport]);

  useEffect(() => {
    if (!payload || aiAutoRequestedRef.current) return;
    if (payload.ai.status !== "idle") return;
    aiAutoRequestedRef.current = true;
    void requestAiFeedback();
  }, [payload, requestAiFeedback]);

  const downloadPdfFile = useCallback(
    async (displayName: string) => {
      const name = encodeURIComponent(displayName);
      const res = await fetch(
        `/api/quiz/v1/sessions/${sessionId}/report/pdf?name=${name}`,
        { headers: { Authorization: `Bearer ${participantToken}` } },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Download failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${displayName}_report.pdf`.replace(/[^a-z0-9._-]+/gi, "_");
      a.click();
      URL.revokeObjectURL(url);
    },
    [sessionId, participantToken],
  );

  const ensurePdfReady = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await fetch(
          `/api/quiz/v1/sessions/${sessionId}/report/pdf`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${participantToken}` },
          },
        );
        const data = (await res.json()) as {
          pdf?: ParticipantReportPayload["pdf"];
          generating?: boolean;
          error?: { message?: string };
        };
        if (!res.ok && res.status !== 202) {
          throw new Error(data.error?.message ?? "Could not prepare PDF.");
        }
        if (data.pdf) {
          setPayload((prev) =>
            prev ? { ...prev, pdf: data.pdf } : prev,
          );
        }
        if (data.pdf?.status === "ready") {
          const displayName =
            payload?.report.display_name ?? "quiz_report";
          await downloadPdfFile(displayName);
          return;
        }
        if (data.pdf?.status === "unavailable") {
          setPdfError(
            data.pdf.error ?? "PDF download is not available right now.",
          );
          return;
        }
        if (res.status !== 202 && data.pdf?.status === "failed") {
          setPdfError(data.pdf.error ?? "PDF generation failed.");
          return;
        }
        if (attempt < 7) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      setPdfError("PDF is still preparing. Try again in a moment.");
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF download failed.");
    } finally {
      setPdfLoading(false);
    }
  }, [sessionId, participantToken, downloadPdfFile, payload?.report.display_name]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading your report…</p>
      </div>
    );
  }

  if (loadError || !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <AlertCircle className="text-destructive h-10 w-10" />
        <p className="max-w-md text-sm">{loadError ?? "Report unavailable."}</p>
        <Button asChild variant="outline">
          <Link href={`/quiz/play/${sessionId}`}>Back to quiz</Link>
        </Button>
      </div>
    );
  }

  const { report, ai, pdf } = payload;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="border-b bg-card/50">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={`/quiz/play/${sessionId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Quiz
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-xs">
              {report.event_title}
            </p>
            <h1 className="truncate text-lg font-bold">Your quiz report</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ReportFeedbackDialog
              sessionId={sessionId}
              participantToken={participantToken}
              defaultDisplayName={report.display_name}
            />
            <QuizAvatar
              emoji={report.avatar || DEFAULT_QUIZ_AVATAR}
              size="lg"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Performance summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Score" value={report.total_score.toLocaleString()} />
            <Stat
              label="Rank"
              value={
                report.rank != null
                  ? `#${report.rank} / ${report.participant_count}`
                  : "—"
              }
            />
            <Stat label="Percentile" value={`${report.percentile}%`} />
            <Stat
              label="Accuracy"
              value={
                report.accuracy_percent != null
                  ? `${report.accuracy_percent}%`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileDown className="h-5 w-5" />
              Download PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Save a private copy of this report. Coach notes are included when
              they are already available.
            </p>
            {pdf?.status === "ready" && !pdfLoading ? (
              <Button
                type="button"
                onClick={() =>
                  void downloadPdfFile(report.display_name)
                }
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                disabled={pdfLoading || pdf?.status === "unavailable"}
                onClick={() => void ensurePdfReady()}
              >
                {pdfLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing PDF…
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Generate &amp; download PDF
                  </>
                )}
              </Button>
            )}
            {pdf?.status === "unavailable" && (
              <p className="text-muted-foreground text-sm">
                {pdf.error ?? "PDF storage is not configured."}
              </p>
            )}
            {pdfError && (
              <p className="text-destructive text-sm">{pdfError}</p>
            )}
            {pdf?.status === "failed" && !pdfError && (
              <p className="text-muted-foreground text-sm">
                {pdf.error ?? "Generation failed."}{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => void ensurePdfReady()}
                >
                  Retry
                </button>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Sparkles className="text-primary h-5 w-5" />
            <CardTitle className="text-base font-semibold">
              Personalized coach notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(ai.status === "generating" || aiLoading) && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating tailored feedback…
              </div>
            )}
            {ai.status === "ready" && ai.feedback && (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{ai.feedback.summary}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <BulletBlock
                    title="Strengths"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    items={ai.feedback.strengths}
                  />
                  <BulletBlock
                    title="Improve"
                    icon={<Target className="h-4 w-4 text-amber-600" />}
                    items={ai.feedback.improvement_areas}
                  />
                </div>
                <BulletBlock
                  title="Next steps"
                  icon={<Lightbulb className="text-primary h-4 w-4" />}
                  items={ai.feedback.prioritized_actions}
                />
              </div>
            )}
            {ai.status === "failed" && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  {ai.error ??
                    "AI feedback is temporarily unavailable. Use the stats below."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void requestAiFeedback()}
                  disabled={aiLoading}
                >
                  Retry
                </Button>
              </div>
            )}
            {ai.status === "unavailable" && (
              <p className="text-muted-foreground text-sm">
                AI coaching is not enabled for this quiz. Your full breakdown is
                below.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <InsightCard title="Strengths" items={report.strengths} />
          <InsightCard title="Focus areas" items={report.improvements} />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4" />
              Pace
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Your average response:{" "}
              <span className="font-medium">
                {formatMs(report.avg_response_time_ms)}
              </span>
            </p>
            <p className="text-muted-foreground mt-1">
              Session average: {formatMs(report.cohort_avg_response_time_ms)} (
              {report.response_time_vs_cohort})
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="questions">
          <TabsList className="w-full">
            <TabsTrigger value="questions" className="flex-1">
              Questions
            </TabsTrigger>
            <TabsTrigger value="types" className="flex-1">
              By type
            </TabsTrigger>
          </TabsList>
          <TabsContent value="questions" className="mt-4 space-y-3">
            {report.question_review.map((q) => (
              <Card key={q.question_id}>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      Q{q.position}. {q.text}
                    </p>
                    {outcomeBadge(q.outcome)}
                  </div>
                  {q.your_answer_label && (
                    <p className="text-muted-foreground text-xs">
                      Your answer: {q.your_answer_label}
                    </p>
                  )}
                  {q.outcome === "incorrect" && q.correct_answer_label && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Correct: {q.correct_answer_label}
                    </p>
                  )}
                  <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                    <span>+{q.score_awarded} pts</span>
                    <span>Time: {formatMs(q.response_time_ms)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="types" className="mt-4">
            <Card>
              <CardContent className="space-y-3 pt-4">
                {report.type_performance.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No scored question types in this quiz.
                  </p>
                ) : (
                  report.type_performance.map((t) => (
                    <div
                      key={t.question_type}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <span className="text-sm capitalize">
                        {t.question_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium">
                        {t.accuracy_percent != null
                          ? `${t.accuracy_percent}% (${t.correct}/${t.answered})`
                          : "—"}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/quiz/join">Play again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/quiz/play/${sessionId}`}>Back to quiz</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function BulletBlock({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
        {icon}
        {title}
      </p>
      <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
