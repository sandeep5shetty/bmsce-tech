"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ExternalLink, Loader2, Plus, Radio, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { EmptyAddCard } from "@/components/common/empty-add-card";

import { QuestionWithResponses } from "@/features/polls/lib/types";

// ─── Mini answer bar shown on dashboard cards ─────────────────────────────────

function MiniAnswerBar({ responses }: { responses: { answer: string }[] }) {
  if (responses.length === 0) return null;
  const yes = responses.filter((r) => r.answer === "Yes").length;
  const no = responses.filter((r) => r.answer === "No").length;
  const yesPct = Math.round((yes / responses.length) * 100);
  const noPct = Math.round((no / responses.length) * 100);
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-green-500" style={{ width: `${yesPct}%` }} />
        <div className="bg-red-400" style={{ width: `${noPct}%` }} />
        <div className="bg-muted flex-1" />
      </div>
      <p className="text-[10px]">
        <span className="font-medium text-green-600">{yesPct}% Yes</span>
        {" · "}
        <span className="font-medium text-red-500">{noPct}% No</span>
      </p>
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

// ─── Individual dashboard card ────────────────────────────────────────────────

function QuestionCard({ q }: { q: QuestionWithResponses }) {
  const lastResponse =
    q.responses.length > 0
      ? q.responses.reduce((a, b) =>
          new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b,
        )
      : null;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-medium">{q.question}</CardTitle>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Open response link"
              onClick={() => window.open(`/q/${q.id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Open live wall"
              onClick={() => window.open(`/live/${q.id}`, "_blank")}
            >
              <Radio className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{q.type}</Badge>
          <Badge variant="outline">
            {q.audience === "all" ? "All Students" : "MCA 1st yr Sec B"}
          </Badge>
          {q.isAnonymous && <Badge variant="outline">Anonymous</Badge>}
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
      </CardContent>
    </Card>
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

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Polls Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create questions and track responses in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/questions/create">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Question
            </Link>
          </Button>
        </div>
      </div>

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
  );
}
