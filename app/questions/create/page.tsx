"use client";

import { useState } from "react";

import { ArrowLeft, Check, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createQuestion } from "@/features/polls/lib/actions";
import { Audience, QuestionType } from "@/features/polls/lib/types";

export default function CreateQuestionPage() {
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<QuestionType>("yes-no");
  const [audience, setAudience] = useState<Audience>("all");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const questionLink =
    typeof window !== "undefined" && generatedId
      ? `${window.location.origin}/q/${generatedId}`
      : "";
  const liveLink =
    typeof window !== "undefined" && generatedId
      ? `${window.location.origin}/live/${generatedId}`
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      const q = await createQuestion({
        question: questionText.trim(),
        type,
        audience,
        isAnonymous,
      });
      setGeneratedId(q.id);
      setQuestionText("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create question");
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/questions">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Create Question</CardTitle>
          <CardDescription>
            Create a poll and share the link with your students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="e.g. Have you completed registration?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="flex items-center gap-3">
              <Label className="shrink-0">Type:</Label>
              <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes-no">Yes / No</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="shrink-0">Audience:</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="cr-only">MCA 1st yr Sec B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Allow Anonymous Responses</p>
                <p className="text-muted-foreground text-xs">
                  Students won&apos;t be identified in the dashboard.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((v) => !v)}
                disabled={submitting}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnonymous ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    isAnonymous ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!questionText.trim() || submitting}
            >
              {submitting ? "Creating..." : "Create Question"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success dialog */}
      <Dialog open={!!generatedId} onOpenChange={() => setGeneratedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question created!</DialogTitle>
            <DialogDescription>
              Share the response link with students, or open the live wall.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs">Response link</Label>
              <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
                <p className="flex-1 truncate font-mono text-sm">{questionLink}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(questionLink)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(liveLink, "_blank")}
              >
                <Radio className="mr-2 h-4 w-4 text-red-500" />
                Open Live Wall
              </Button>
              <Button asChild className="flex-1">
                <Link href="/questions">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Radio({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}
