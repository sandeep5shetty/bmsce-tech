"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ExternalLink,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { EmptyAddCard } from "@/components/common/empty-add-card";

import { QuestionWithResponses } from "@/features/polls/lib/types";

const LIVE_WINDOW_MS = 10 * 60 * 1000;

// ─── Mini answer bar shown on dashboard cards ─────────────────────────────────

function MiniAnswerBar({ responses }: { responses: { answer: string }[] }) {
  if (responses.length === 0) return null;
  const yes = responses.filter((r) => r.answer === "Yes").length;
  const no = responses.filter((r) => r.answer === "No").length;
  const yesPct = Math.round((yes / responses.length) * 100);
  const noPct = Math.round((no / responses.length) * 100);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-linear-to-r from-emerald-500 to-emerald-400"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="bg-linear-to-r from-red-500 to-red-400"
          style={{ width: `${noPct}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium">{yesPct}% Yes</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="font-medium">{noPct}% No</span>
        </span>
      </div>
    </div>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isRecentlyActive(q: QuestionWithResponses): boolean {
  if (q.responses.length === 0) return false;
  const last = q.responses.reduce((a, b) =>
    new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b,
  );
  return Date.now() - new Date(last.submittedAt).getTime() < LIVE_WINDOW_MS;
}

// ─── Individual dashboard card ────────────────────────────────────────────────

function QuestionCard({ q }: { q: QuestionWithResponses }) {
  const lastResponse =
    q.responses.length > 0
      ? q.responses.reduce((a, b) =>
          new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b,
        )
      : null;
  const live = isRecentlyActive(q);

  return (
    <div className="group bg-card hover:border-primary/30 relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base leading-snug font-bold">{q.question}</p>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            title="Open response link"
            onClick={() => window.open(`/q/${q.id}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="relative h-8 w-8"
            title="Open live wall"
            onClick={() => window.open(`/live/${q.id}`, "_blank")}
          >
            <Radio className="h-4 w-4 text-red-500" />
            {live && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{q.type}</Badge>
        <Badge variant="outline">
          {q.audience === "all" ? "All Students" : "MCA 1st yr Sec B"}
        </Badge>
        {q.isAnonymous && <Badge variant="outline">Anonymous</Badge>}
        {live && (
          <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/15 dark:text-red-400">
            ● Live now
          </Badge>
        )}
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground text-xs">
          {q.responses.length} response{q.responses.length !== 1 ? "s" : ""}
        </span>
        {lastResponse ? (
          <span className="text-muted-foreground text-xs">
            · last {relativeTime(lastResponse.submittedAt)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            {new Date(q.createdAt).toLocaleDateString("en-IN")}
          </span>
        )}
      </div>

      {q.type === "yes-no" && q.responses.length > 0 && (
        <MiniAnswerBar responses={q.responses} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadQuestions() {
    const res = await fetch("/api/questions");
    if (res.ok) setQuestions(await res.json());
  }

  useEffect(() => {
    loadQuestions().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadQuestions();
    } finally {
      setRefreshing(false);
    }
  }

  const stats = useMemo(() => {
    const totalResponses = questions.reduce(
      (sum, q) => sum + q.responses.length,
      0,
    );
    const liveCount = questions.filter(isRecentlyActive).length;
    const avgPerQuestion = questions.length
      ? Math.round(totalResponses / questions.length)
      : 0;
    return {
      questionCount: questions.length,
      totalResponses,
      liveCount,
      avgPerQuestion,
    };
  }, [questions]);

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="from-primary/25 pointer-events-none absolute -top-32 -right-16 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-linear-to-br from-orange-500/20 to-transparent blur-3xl" />

        <div className="relative container mx-auto max-w-6xl px-6 pt-16 pb-10">
          <span className="text-primary bg-primary/10 mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Real-time Class Polls
          </span>
          <h1 className="font-serif max-w-2xl text-5xl leading-[1.02] font-normal">
            Ask your class, see answers live.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Create a question, share the link, and watch responses roll in —
            with an optional live wall to project during class or events.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link href="/questions/create">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Question
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto mb-10 grid max-w-6xl grid-cols-2 gap-3 px-6 sm:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.questionCount}
          </div>
          <div className="text-muted-foreground text-xs">Questions created</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.totalResponses}
          </div>
          <div className="text-muted-foreground text-xs">Total responses</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.liveCount}
          </div>
          <div className="text-muted-foreground text-xs">Live right now</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.avgPerQuestion}
          </div>
          <div className="text-muted-foreground text-xs">Avg per question</div>
        </div>
      </div>

      <div className="container mx-auto mb-32 max-w-6xl px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <EmptyAddCard
            title="Create Question"
            description="Create your first question and share the link."
            href="/questions/create"
          />
        ) : (
          <div className="grid gap-4">
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
