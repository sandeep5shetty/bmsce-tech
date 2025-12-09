"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Question } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Github } from "lucide-react";
import { StudentSelector } from "@/components/student-selector";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Spinner } from "@/components/ui/spinner";

export default function QuestionPage() {
  const params = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      const id = params.id as string;
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [params.id]);

  const handleSubmit = async (selectedAnswer?: string, anonymous = false) => {
    const finalAnswer = selectedAnswer || answer;

    if (!finalAnswer) {
      toast.error("Please provide an answer");
      return;
    }

    // Validation only when not submitting anonymously
    if (!anonymous) {
      // For MCA B Sec (cr-only), require student selection
      if (question?.audience === "cr-only" && !studentId) {
        toast.error("Please select your name");
        return;
      }

      // For all students, require name input
      if (question?.audience === "all" && !name.trim()) {
        toast.error("Please enter your name");
        return;
      }
    }

    setSubmitting(true);
    try {
      // Build request body conditionally
      const requestBody: {
        questionId: string;
        answer: string;
        studentId?: string;
        name?: string;
      } = {
        questionId: question!.id,
        answer: finalAnswer,
      };

      // Only add studentId if not anonymous and has value
      if (!anonymous && studentId) {
        requestBody.studentId = studentId;
      }

      // Only add name if not anonymous, audience is "all", and has value
      if (!anonymous && question?.audience === "all" && name.trim()) {
        requestBody.name = name.trim();
      }

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit response");
      }

      setSubmitted(true);
      toast.success("Response submitted successfully!");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit response. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 max-sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/sandeep5shetty/bmsce-tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 max-sm:py-4 w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{question.question}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {question.audience === "cr-only"
                ? "For MCA 1st yr B Sec students"
                : "For all students"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.type === "yes-no" ? (
              <>
                {/* Yes/No selection - store answer without submitting */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    onClick={() => setAnswer("Yes")}
                    variant={answer === "Yes" ? "default" : "outline"}
                    className={`h-24 text-lg font-semibold ${
                      answer === "Yes" ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    <CheckCircle2 className="h-6 w-6 mr-2" />
                    Yes
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setAnswer("No")}
                    variant={answer === "No" ? "destructive" : "outline"}
                    className="h-24 text-lg font-semibold"
                  >
                    <XCircle className="h-6 w-6 mr-2" />
                    No
                  </Button>
                </div>

                {/* Name input for Yes/No questions */}
                {question.audience === "cr-only" ? (
                  <div className="space-y-2">
                    <Label>Select Your Name</Label>
                    <StudentSelector
                      value={studentId}
                      onSelect={setStudentId}
                      required={!question.isAnonymous}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-base"
                    />
                  </div>
                )}

                {/* Submit buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSubmit()}
                    size="lg"
                    className="w-full"
                    disabled={!answer || submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Response"
                    )}
                  </Button>

                  {question.isAnonymous && (
                    <Button
                      onClick={() => handleSubmit(undefined, true)}
                      size="lg"
                      variant="outline"
                      className="w-full"
                      disabled={!answer || submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Anonymously"
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
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

                {/* Name input for Short Answer questions */}
                {question.audience === "cr-only" ? (
                  <div className="space-y-2">
                    <Label>Select Your Name</Label>
                    <StudentSelector
                      value={studentId}
                      onSelect={setStudentId}
                      required={!question.isAnonymous}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-base"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => handleSubmit()}
                    size="lg"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Response"
                    )}
                  </Button>

                  {question.isAnonymous && (
                    <Button
                      onClick={() => handleSubmit(undefined, true)}
                      size="lg"
                      variant="outline"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Anonymously"
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <div className="text-sm text-muted-foreground text-center sm:text-right mt-4 md:mr-2">
          Made by{" "}
          <a
            href="https://sandeepshetty.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors underline text-primary/75 hover:text-primary/45 "
          >
            Sandy
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
