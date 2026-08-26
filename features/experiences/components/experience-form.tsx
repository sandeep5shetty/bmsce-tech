"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FileText, Plus, Trash2, Youtube } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createExperience } from "../lib/actions";
import {
  ExperienceRoundInput,
  ResourceInput,
  createExperienceSchema,
  difficultyOptions,
  resourceTypeOptions,
  resultOptions,
  roundTypeOptions,
} from "../lib/validation";

function emptyRound(roundNumber: number): ExperienceRoundInput {
  return {
    roundNumber,
    roundType: "Technical",
    description: "",
    difficulty: undefined,
  };
}

function emptyResource(): ResourceInput {
  return { type: "text", title: "", content: "" };
}

const resourceTypeLabel: Record<(typeof resourceTypeOptions)[number], string> = {
  pdf: "PDF Link",
  youtube: "YouTube Link",
  text: "Text Note",
};

const resourceTypeIcon: Record<
  (typeof resourceTypeOptions)[number],
  typeof FileText
> = {
  pdf: FileText,
  youtube: Youtube,
  text: FileText,
};

export function ExperienceForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [batch, setBatch] = useState("");
  const [result, setResult] = useState<(typeof resultOptions)[number]>("Selected");
  const [ctcLpa, setCtcLpa] = useState("");
  const [overview, setOverview] = useState("");
  const [preparationResources, setPreparationResources] = useState("");
  const [rounds, setRounds] = useState<ExperienceRoundInput[]>([emptyRound(1)]);
  const [resources, setResources] = useState<ResourceInput[]>([]);

  function updateRound(index: number, patch: Partial<ExperienceRoundInput>) {
    setRounds((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRound() {
    setRounds((prev) => [...prev, emptyRound(prev.length + 1)]);
  }

  function removeRound(index: number) {
    setRounds((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, roundNumber: i + 1 })),
    );
  }

  function addResource() {
    setResources((prev) => [...prev, emptyResource()]);
  }

  function updateResource(index: number, patch: Partial<ResourceInput>) {
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function removeResource(index: number) {
    setResources((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const sanitizedResources = resources.filter((r) => r.content.trim());

    const parsed = createExperienceSchema.safeParse({
      companyName,
      role,
      batch,
      result,
      ctcLpa: ctcLpa ? Number(ctcLpa) : undefined,
      overview,
      preparationResources: preparationResources || undefined,
      rounds,
      resources: sanitizedResources,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const roundErrors = parsed.error.flatten().formErrors;
      const first =
        Object.values(errors).flat()[0] ?? roundErrors[0] ?? "Validation error";
      toast.error(first);
      return;
    }

    setIsSubmitting(true);
    try {
      const experience = await createExperience(parsed.data);
      toast.success("Experience shared, thank you!");
      router.push(`/experiences/${experience.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to share experience",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Share Your Interview Experience</CardTitle>
        <CardDescription>
          Help juniors prepare — company, rounds, and how you got ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                placeholder="e.g. Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g. SDE Intern"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                placeholder="e.g. 2024-26"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Result</Label>
              <Select
                value={result}
                onValueChange={(v) => setResult(v as typeof result)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resultOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctcLpa">
                CTC (LPA) <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="ctcLpa"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 8"
                value={ctcLpa}
                onChange={(e) => setCtcLpa(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="overview">Overall Experience</Label>
            <Textarea
              id="overview"
              placeholder="How the process went overall, general tips, timeline..."
              rows={4}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preparationResources">
              Preparation Resources{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="preparationResources"
              placeholder="Courses, books, websites, playlists you used..."
              rows={2}
              value={preparationResources}
              onChange={(e) => setPreparationResources(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Rounds
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRound}
                disabled={isSubmitting}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Round
              </Button>
            </div>

            {rounds.map((round, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Round {round.roundNumber}</p>
                  {rounds.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRound(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={round.roundType}
                      onValueChange={(v) =>
                        updateRound(index, {
                          roundType: v as ExperienceRoundInput["roundType"],
                        })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roundTypeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Difficulty{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={round.difficulty ?? "unset"}
                      onValueChange={(v) =>
                        updateRound(index, {
                          difficulty:
                            v === "unset"
                              ? undefined
                              : (v as ExperienceRoundInput["difficulty"]),
                        })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not set</SelectItem>
                        {difficultyOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Questions asked / what happened</Label>
                  <Textarea
                    placeholder="Describe the questions asked and format of this round..."
                    rows={3}
                    value={round.description}
                    onChange={(e) =>
                      updateRound(index, { description: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Question Bank
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Attach a PDF link, a YouTube link, or a text note for this company.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResource}
                disabled={isSubmitting}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Resource
              </Button>
            </div>

            {resources.map((resource, index) => {
              const Icon = resourceTypeIcon[resource.type];
              return (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="text-muted-foreground h-4 w-4" />
                      <Select
                        value={resource.type}
                        onValueChange={(v) =>
                          updateResource(index, {
                            type: v as ResourceInput["type"],
                          })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {resourceTypeLabel[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Input
                    placeholder="Title (optional)"
                    value={resource.title}
                    onChange={(e) =>
                      updateResource(index, { title: e.target.value })
                    }
                    disabled={isSubmitting}
                  />

                  {resource.type === "text" ? (
                    <Textarea
                      placeholder="Write your notes, questions, or tips here..."
                      rows={3}
                      value={resource.content}
                      onChange={(e) =>
                        updateResource(index, { content: e.target.value })
                      }
                      disabled={isSubmitting}
                    />
                  ) : (
                    <Input
                      placeholder={
                        resource.type === "pdf"
                          ? "https://drive.google.com/..."
                          : "https://youtube.com/watch?v=..."
                      }
                      value={resource.content}
                      onChange={(e) =>
                        updateResource(index, { content: e.target.value })
                      }
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sharing..." : "Share Experience"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
