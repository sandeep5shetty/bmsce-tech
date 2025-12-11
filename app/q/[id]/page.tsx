"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // redirect unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined") {
        signIn("google", { callbackUrl: window.location.href });
      }
    }
  }, [status]);

  /* ===========================================
        FIXED FETCH QUESTION LOGIC
     =========================================== */
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoadingQuestion(true);

        const id =
          typeof params.id === "string"
            ? params.id
            : Array.isArray(params.id)
            ? params.id[0]
            : "";

        if (!id) {
          console.error("❌ No ID found in params");
          return;
        }

        const r = await fetch(`/api/questions/${id}`);
        if (!active) return;

        setQuestion(r.ok ? await r.json() : null);
      } finally {
        if (active) setLoadingQuestion(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [params.id]);

  // submit answer
  const handleSubmit = async (selectedAnswer?: string) => {
    const finalAnswer = selectedAnswer ?? answer;

    if (!finalAnswer) {
      toast.error("Please provide an answer");
      return;
    }

    if (!userEmail?.endsWith("@bmsce.ac.in")) {
      toast.error("Only BMSCE email can submit responses.");
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
          email: userEmail,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setSubmitted(true);
      toast.success("Response submitted!");
    } catch {
      toast.error("Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // loading screen
  if (status === "loading" || loadingQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // block non-BMSCE email
  if (status === "authenticated" && !userEmail?.endsWith("@bmsce.ac.in")) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="mt-2">
            Please sign in with your <strong>@bmsce.ac.in</strong> email.
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              signIn("google", { callbackUrl: window.location.href })
            }
          >
            Sign in with BMSCE Email
          </Button>
        </div>
      </div>
    );
  }

  // question not found
  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Question not found.</p>
      </div>
    );
  }

  // submitted
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

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{question.question}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {question.type === "yes-no" ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleSubmit("Yes")}
                >
                  ✔ Yes
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleSubmit("No")}
                >
                  ✘ No
                </Button>
              </div>
            ) : (
              <>
                <Label>Your Answer</Label>
                <Input
                  placeholder="Type your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />

                <Button
                  className="w-full"
                  disabled={!answer || submitting}
                  onClick={() => handleSubmit()}
                >
                  {submitting ? "Submitting..." : "Submit Response"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
