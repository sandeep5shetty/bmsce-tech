"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionType, Audience } from "@/lib/types";
import { Copy, Check, Github, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/footer";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [type, setType] = useState<QuestionType>("yes-no");
  const [audience, setAudience] = useState<Audience>("all");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          type,
          audience,
          isAnonymous,
          requireName: audience === "cr-only",
        }),
      });

      if (!response.ok) throw new Error("Failed to create question");

      const newQuestion = await response.json();
      const link = `${window.location.origin}/q/${newQuestion.id}`;
      setGeneratedLink(link);
      setShowDialog(true);

      // Reset form
      setQuestion("");
      setType("yes-no");
      setAudience("all");
      setIsAnonymous(false);
    } catch (error) {
      console.error("Error creating question:", error);
      alert("Failed to create question. Please try again.");
    }
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-0  lg:gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
          </Link>
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
      </nav>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 max-sm:py-3">
        <Link href="/" className="inline-block mb-4">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Link>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Create Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  placeholder="e.g., Have you completed registration?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2 flex gap-2">
                <Label htmlFor="type">Question Type : </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as QuestionType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes-no">Yes/No</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex gap-2">
                <Label htmlFor="audience">Audience : </Label>
                <Select
                  value={audience}
                  onValueChange={(v) => setAudience(v as Audience)}
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="cr-only">MCA 1st yr B Sec</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Allow Anonymous Responses
                  </Label>
                  <Switch
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Question
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question Created!</DialogTitle>
            <DialogDescription>
              Share this link with your students:
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={generatedLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-4">
            <Link href="/dashboard">
              <Button className="w-full" variant="default">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
