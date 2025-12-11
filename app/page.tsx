"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Spinner } from "@/components/ui/spinner";

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(window.location.href);
      window.location.href = `/login?callbackUrl=${callbackUrl}`;
    }
  }, [status]);

  useEffect(() => {
    let mounted = true;
    async function fetchQuestion() {
      try {
        setLoading(true);
        const res = await fetch(`/api/questions/${params.id}`);
        if (!mounted) return;
        if (res.ok) setQuestion(await res.json());
        else setQuestion(null);
      } catch (e) {
        console.error(e);
        if (mounted) setQuestion(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchQuestion();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const handleSubmit = async (selectedAnswer?: string, anonymous = false) => {
    const finalAnswer = selectedAnswer || answer;
    if (!finalAnswer) {
      toast.error("Please provide an answer");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          answer: finalAnswer,
          email: anonymous ? null : userEmail,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      toast.success("Response submitted!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  if (session && !userEmail?.endsWith("@bmsce.ac.in")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-semibold text-lg">
          Only BMSCE students can answer this question.
        </p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Question not found.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="text-center space-y-4 p-6">
            <span className="text-green-600 text-6xl block">✔</span>
            <h2 className="text-2xl font-semibold">Thank You!</h2>
            <p>Your response has been recorded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.svg" alt="logo" width={100} height={100} />
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{question.question}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {question.type === "yes-no" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    onClick={() => setAnswer("Yes")}
                    variant={answer === "Yes" ? "default" : "outline"}
                  >
                    ✔ Yes
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => setAnswer("No")}
                    variant={answer === "No" ? "default" : "outline"}
                  >
                    ✘ No
                  </Button>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleSubmit()}
                  disabled={!answer || submitting}
                >
                  {submitting ? "Submitting..." : "Submit Response"}
                </Button>

                {question.isAnonymous && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubmit(undefined, true)}
                    disabled={!answer || submitting}
                  >
                    Submit Anonymously
                  </Button>
                )}
              </>
            ) : (
              <>
                <Label>Your Answer</Label>
                <Input
                  placeholder="Type here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />

                <Button
                  className="w-full"
                  onClick={() => handleSubmit()}
                  disabled={!answer || submitting}
                >
                  {submitting ? "Submitting..." : "Submit Response"}
                </Button>

                {question.isAnonymous && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubmit(undefined, true)}
                    disabled={!answer || submitting}
                  >
                    Submit Anonymously
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
