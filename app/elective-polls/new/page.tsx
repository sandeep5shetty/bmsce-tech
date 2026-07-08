"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  type AudienceDraft,
  AudienceRuleEditor,
  EMPTY_AUDIENCE,
} from "@/features/elective-polls/components/audience-rule-editor";
import {
  type OptionDraft,
  OptionDraftEditor,
} from "@/features/elective-polls/components/option-draft-editor";

export default function NewElectivePollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { label: "", description: "", capacity: "" },
  ]);
  const [audience, setAudience] = useState<AudienceDraft>(EMPTY_AUDIENCE);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedOptions = options
      .map((o) => ({
        label: o.label.trim(),
        description: o.description.trim() || null,
        capacity: Number(o.capacity),
      }))
      .filter((o) => o.label.length > 0);

    if (trimmedOptions.length === 0) {
      toast.error("Add at least one option");
      return;
    }
    if (
      trimmedOptions.some(
        (o) => !Number.isInteger(o.capacity) || o.capacity <= 0,
      )
    ) {
      toast.error("Every option needs a positive whole-number seat capacity");
      return;
    }

    if (audience.mode === "group" && !audience.rule) {
      toast.error("Select a group for a group-targeted poll");
      return;
    }
    if (audience.mode === "custom" && audience.members.length === 0) {
      toast.error("Select at least one student for a custom audience");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/elective-polls/v1/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          options: trimmedOptions,
          audienceMode: audience.mode,
          audienceRule:
            audience.mode === "group" && audience.rule
              ? {
                  batch: audience.rule.batch.trim(),
                  section: audience.rule.section.trim() || null,
                }
              : null,
          audienceMemberStudentIds:
            audience.mode === "custom" ? audience.members.map((m) => m.id) : [],
          audienceExcludedStudentIds:
            audience.mode === "group"
              ? audience.excludedMembers.map((m) => m.id)
              : [],
        }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to create poll");
      toast.success("Poll created");
      router.push(`/elective-polls/${body.poll.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create poll",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/elective-polls">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Create Elective Poll</CardTitle>
          <CardDescription>
            Students pick one option each; every option locks automatically once
            its seats fill up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. MCA 2nd Year Elective Selection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Any instructions for students"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            <OptionDraftEditor
              value={options}
              onChange={setOptions}
              disabled={submitting}
            />

            <AudienceRuleEditor
              value={audience}
              onChange={setAudience}
              disabled={submitting}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!title.trim() || submitting}
            >
              {submitting ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
