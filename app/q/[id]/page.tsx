"use client";

import { useEffect, useState } from "react";

import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getUser } from "@/actions/user";
import { submitResponse } from "@/features/polls/lib/actions";
import { QuestionWithResponses } from "@/features/polls/lib/types";
import { StudentCombobox } from "@/features/placement/components/student-combobox";
import { Student } from "@/types";

export default function QuestionPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
  });

  const [question, setQuestion] = useState<QuestionWithResponses | null>(null);
  const [loadingQ, setLoadingQ] = useState(true);
  const [answer, setAnswer] = useState("");
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<Pick<Student, "id" | "name" | "email">[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/questions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestion(data);
        if (user && data.responses?.some((r: { email: string }) => r.email === user.email)) {
          setAlreadyAnswered(true);
        }
      })
      .finally(() => setLoadingQ(false));
  }, [id, user]);

  useEffect(() => {
    if (question?.audience === "cr-only") {
      fetch("/api/students")
        .then((r) => r.json())
        .then(setStudents);
    }
  }, [question?.audience]);

  async function handleSubmit(selectedAnswer?: string) {
    const finalAnswer = selectedAnswer ?? answer;
    if (!finalAnswer.trim()) {
      toast.error("Please provide an answer");
      return;
    }
    if (!user) {
      toast.error("Please log in to submit a response.");
      return;
    }

    const selectedStudent = students.find((s) => s.id === studentId);

    setSubmitting(true);
    try {
      await submitResponse({
        questionId: id,
        answer: finalAnswer,
        email: user.email,
        studentName: selectedStudent?.name ?? undefined,
      });
      setSubmitted(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to submit";
      if (msg === "Already submitted") {
        setAlreadyAnswered(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || loadingQ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!question || (question as { error?: string }).error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Question not found.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="font-medium">You must be logged in to respond.</p>
            <Button asChild className="w-full">
              <Link href={`/auth/login?callbackUrl=/q/${id}`}>Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted || alreadyAnswered) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-8 pb-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold">
              {alreadyAnswered && !submitted ? "Already Submitted" : "Thank You!"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {alreadyAnswered && !submitted
                ? "You have already submitted a response to this question."
                : "Your response has been recorded."}
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{question.question}</CardTitle>
          {question.audience === "cr-only" && (
            <p className="text-muted-foreground text-xs">
              MCA 1st yr Sec B — please select your name below.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {question.audience === "cr-only" && (
            <div className="space-y-2">
              <Label>Your Name</Label>
              <StudentCombobox
                users={students}
                value={studentId}
                onChange={setStudentId}
                disabled={submitting}
              />
            </div>
          )}

          {question.type === "yes-no" ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-14 bg-green-600 text-base hover:bg-green-700"
                disabled={submitting || (question.audience === "cr-only" && !studentId)}
                onClick={() => handleSubmit("Yes")}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "✔ Yes"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base"
                disabled={submitting || (question.audience === "cr-only" && !studentId)}
                onClick={() => handleSubmit("No")}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "✘ No"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  placeholder="Type your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={
                  !answer.trim() ||
                  submitting ||
                  (question.audience === "cr-only" && !studentId)
                }
                onClick={() => handleSubmit()}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
