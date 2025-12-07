"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Question } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { StudentSelector } from "@/components/student-selector";
import Image from "next/image";

export default function QuestionPage() {
  const params = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [studentId, setStudentId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      const id = params.id as string;
      try {
        const response = await fetch(`/api/questions/${id}`);
        if (response.ok) {
          const data = await response.json();
          setQuestion(data);
        } else {
          setQuestion(null);
        }
      } catch (error) {
        console.error("Error fetching question:", error);
        setQuestion(null);
      }
    };

    fetchQuestion();
  }, [params.id]);

  const handleSubmit = async (selectedAnswer?: string) => {
    const finalAnswer = selectedAnswer || answer;

    if (!finalAnswer) {
      toast.error("Please provide an answer");
      return;
    }

    if (question?.requireName && !studentId) {
      toast.error("Please select your name");
      return;
    }

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question!.id,
          answer: finalAnswer,
          studentId: studentId || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit response");

      setSubmitted(true);
      toast.success("Response submitted successfully!");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response. Please try again.");
    }
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Question not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your response has been recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Image src="/logo.svg" alt="BMSCE.tech+" width={100} height={100} />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{question.question}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {question.audience === "cr-only"
                ? "For CR only"
                : "For all students"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.type === "yes-no" ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  onClick={() => handleSubmit("Yes")}
                  className="h-24 text-lg font-semibold bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Yes
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleSubmit("No")}
                  variant="destructive"
                  className="h-24 text-lg font-semibold"
                >
                  <XCircle className="h-6 w-6 mr-2" />
                  No
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="text-base"
                />
              </div>
            )}

            {question.requireName && (
              <div className="space-y-2">
                <Label>Select Your Name (Required)</Label>
                <StudentSelector
                  value={studentId}
                  onSelect={setStudentId}
                  required
                />
              </div>
            )}

            {!question.requireName && question.type === "short-answer" && (
              <div className="space-y-2">
                <Label>Select Your Name (Optional)</Label>
                <StudentSelector
                  value={studentId}
                  onSelect={setStudentId}
                  required={false}
                />
              </div>
            )}

            {question.type === "short-answer" && (
              <Button
                onClick={() => handleSubmit()}
                size="lg"
                className="w-full"
              >
                Submit Response
              </Button>
            )}

            {question.isAnonymous && (
              <p className="text-xs text-center text-muted-foreground">
                Your response will be anonymous
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
