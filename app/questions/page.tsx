"use client";

import { useEffect, useState } from "react";

import {
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { QuestionWithResponses } from "@/features/polls/lib/types";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuestionWithResponses | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/questions");
        if (res.ok) setQuestions(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();

    const interval = setInterval(async () => {
      const res = await fetch("/api/questions");
      if (res.ok) setQuestions(await res.json());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  function exportCSV() {
    if (!selected) return;
    const headers = ["Email", "Student Name", "Answer", "Submitted At"];
    const rows = selected.responses.map((r) => [
      r.email,
      r.studentName ?? "",
      r.answer,
      new Date(r.submittedAt).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.question.slice(0, 30)}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
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
        <Button asChild size="sm">
          <Link href="/questions/create">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Question
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : selected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              ← Back
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCSV}
              disabled={!selected.responses.length}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selected.question}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{selected.type}</Badge>
                <Badge variant="outline">{selected.audience === "all" ? "All Students" : "MCA 1st yr Sec B"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {selected.responses.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No responses yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.responses.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.email}</TableCell>
                        <TableCell>{r.studentName ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.answer === "Yes"
                                ? "default"
                                : r.answer === "No"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {r.answer}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(r.submittedAt).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : questions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No questions yet</EmptyTitle>
            <EmptyDescription>
              Create your first question and share the link.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href="/questions/create">Create Question</Link>
          </Button>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {questions.map((q) => (
            <Card
              key={q.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelected(q)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base font-medium">
                    {q.question}
                  </CardTitle>
                  <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
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
              <CardContent>
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
                  <span className="text-muted-foreground text-xs">
                    {new Date(q.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
