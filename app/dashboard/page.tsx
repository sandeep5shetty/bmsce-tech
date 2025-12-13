"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import Link from "next/link";
=======
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Pusher from "pusher-js";
import { toast } from "sonner";
import {
  Download,
  ArrowLeft,
  ExternalLink,
  Github,
  Radio, // 🔥 added icon
} from "lucide-react";

>>>>>>> 71dc632 (Added Livewall)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
<<<<<<< HEAD
import { Question, Response } from "@/lib/types";
import { Download, ArrowLeft, ExternalLink, Github } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

=======
import { Spinner } from "@/components/ui/spinner";
import { Footer } from "@/components/footer";
import { Question, Response } from "@/lib/types";

export default function DashboardPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Initial fetch + realtime new questions
>>>>>>> 71dc632 (Added Livewall)
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
<<<<<<< HEAD
        const response = await fetch("/api/questions");
        if (response.ok) {
          const data = await response.json();
          setQuestions(data);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
=======
        const res = await fetch("/api/questions");
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        console.error(err);
>>>>>>> 71dc632 (Added Livewall)
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
<<<<<<< HEAD
  }, []);

  const handleQuestionClick = (
    question: Question & { responses?: Response[] }
  ) => {
=======

    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );

    const channel = pusher.subscribe("questions");

    channel.bind("new-question", (question: Question) => {
      setQuestions((prev) => [question, ...prev]);
      toast.success("New question added");
    });

    return () => {
      pusher.unsubscribe("questions");
      pusher.disconnect();
    };
  }, []);

  const handleQuestionClick = (question: Question & { responses?: Response[] }) => {
>>>>>>> 71dc632 (Added Livewall)
    setSelectedQuestion(question);
    setResponses(question.responses || []);
  };

  const exportToCSV = () => {
    if (!selectedQuestion) return;

    const headers = ["Email", "Answer", "Submitted At"];
    const rows = responses.map((r) => [
      r.email || "Unknown",
      r.answer,
      new Date(r.submittedAt).toLocaleString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
<<<<<<< HEAD
=======

>>>>>>> 71dc632 (Added Livewall)
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedQuestion.question.slice(0, 30)}-responses.csv`;
    a.click();
<<<<<<< HEAD
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully!");
=======

    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
>>>>>>> 71dc632 (Added Livewall)
  };

  const getResponseStats = (question: Question) => {
    const res = question.responses || [];
    if (question.type === "yes-no") {
      const yes = res.filter((r) => r.answer === "Yes").length;
      const no = res.filter((r) => r.answer === "No").length;
      return `${yes} Yes, ${no} No`;
    }
    return `${res.length} responses`;
  };

  const openQuestionLink = (id: string) => {
<<<<<<< HEAD
    const link = `${window.location.origin}/q/${id}`;
    window.open(link, "_blank");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
=======
    window.open(`${window.location.origin}/q/${id}`, "_blank");
  };

  // 🔥 LIVE WALL LINK
  const openLiveWall = (id: string) => {
    window.open(`${window.location.origin}/live/${id}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white/70 dark:bg-slate-950/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={100} height={40} />
>>>>>>> 71dc632 (Added Livewall)
          </Link>

          <a
            href="https://github.com/sandeep5shetty/bmsce-tech"
            target="_blank"
            rel="noopener noreferrer"
          >
<<<<<<< HEAD
            <Button variant="outline" size="sm" className="gap-2">
              <Github className="w-4 h-4" />
              View on GitHub
            </Button>
          </a>
        </div>
        
       
=======
            <Button variant="outline" size="sm">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </a>
        </div>
>>>>>>> 71dc632 (Added Livewall)
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {!selectedQuestion ? (
<<<<<<< HEAD
          <div className="space-y-4">

            {/* FIXED MERGE CONFLICT — chose remote + your version combined */}
            <div className="flex items-center justify-start gap-4 mb-4">
=======
          <>
            <div className="flex items-center gap-4 mb-4">
>>>>>>> 71dc632 (Added Livewall)
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </Link>
              <h2 className="text-2xl font-semibold">Your Questions</h2>
            </div>

            {loading ? (
<<<<<<< HEAD
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-5xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold">No questions yet</h3>
                    <p className="text-muted-foreground">
                      Create a question and start getting responses.
                    </p>
                    <Link href="/create">
                      <Button className="mt-4">Create Your First Question</Button>
                    </Link>
                  </div>
=======
              <div className="flex flex-col items-center py-12 gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground">Loading questions…</p>
              </div>
            ) : questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <h3 className="text-xl font-semibold">No questions yet</h3>
                  <Link href="/create">
                    <Button className="mt-4">Create Question</Button>
                  </Link>
>>>>>>> 71dc632 (Added Livewall)
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {questions.map((q) => (
                  <Card
                    key={q.id}
<<<<<<< HEAD
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleQuestionClick(q)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg mb-2">{q.question}</CardTitle>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                              {q.type === "yes-no" ? "Yes/No" : "Short Answer"}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQuestionLink(q.id);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
=======
                    className="cursor-pointer hover:shadow"
                    onClick={() => handleQuestionClick(q)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle>{q.question}</CardTitle>

                        <div className="flex gap-1">
                          {/* 🔗 Open Question */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuestionLink(q.id);
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>

                          {/* 🔥 Open Live Wall */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveWall(q.id);
                            }}
                            title="Open Live Wall"
                          >
                            <Radio className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
>>>>>>> 71dc632 (Added Livewall)
                      </div>
                    </CardHeader>

                    <CardContent>
<<<<<<< HEAD
                      <p className="text-sm font-medium">{getResponseStats(q)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(q.createdAt).toLocaleDateString()}
                      </p>
=======
                      <p className="text-sm">{getResponseStats(q)}</p>
>>>>>>> 71dc632 (Added Livewall)
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
<<<<<<< HEAD
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setSelectedQuestion(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Questions
              </Button>

              <Button onClick={exportToCSV} disabled={responses.length === 0}>
                <Download className="h-4 w-4 mr-2" />
=======
          </>
        ) : (
          <>
            <div className="flex justify-between mb-4">
              <Button variant="ghost" onClick={() => setSelectedQuestion(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button onClick={exportToCSV} disabled={!responses.length}>
                <Download className="w-4 h-4 mr-2" />
>>>>>>> 71dc632 (Added Livewall)
                Export CSV
              </Button>
            </div>

            <Card>
              <CardHeader>
<<<<<<< HEAD
                <CardTitle className="text-xl">{selectedQuestion.question}</CardTitle>
              </CardHeader>

              <CardContent>
                {responses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No responses yet</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Answer</TableHead>
                          <TableHead>Submitted At</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {responses.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell className="font-medium">{response.email}</TableCell>

                            <TableCell>
                              <span
                                className={
                                  response.answer === "Yes"
                                    ? "text-green-600 font-medium"
                                    : response.answer === "No"
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {response.answer}
                              </span>
                            </TableCell>

                            <TableCell className="text-muted-foreground">
                              {new Date(response.submittedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
=======
                <CardTitle>{selectedQuestion.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.answer}</TableCell>
                        <TableCell>
                          {new Date(r.submittedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>

>>>>>>> 71dc632 (Added Livewall)
      <Footer />
    </div>
  );
}
