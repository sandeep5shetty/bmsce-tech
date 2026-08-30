"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Briefcase, Paperclip, Plus, Trash2 } from "lucide-react";
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

import { createExperience, updateExperience } from "../lib/actions";
import { ExperienceFormInitialData } from "../lib/experience-form-input";
import {
  ExperienceRoundInput,
  ResourceInput,
  RoundOutcome,
  UploadedDocumentInput,
  createExperienceSchema,
  difficultyOptions,
  resultOptions,
  roundOutcomeOptions,
  roundTypeLabel,
  roundTypeOptions,
  updateExperienceSchema,
} from "../lib/validation";
import { BatchCombobox } from "./batch-combobox";
import { DocumentUpload, UploadedDocument } from "./document-upload";
import { LogoUpload } from "./logo-upload";
import { roundOutcomeMeta } from "./round-outcome";

function emptyRound(roundNumber: number): ExperienceRoundInput {
  return {
    roundNumber,
    // A drive almost always opens with a screening test, so round 1 defaults to
    // Aptitude and everything after it to a technical interview.
    roundType: roundNumber === 1 ? "Aptitude" : "Technical",
    description: "",
    difficulty: undefined,
    outcome: "Cleared",
  };
}

/**
 * A resource row while it is being filled in: the name is typed first and the
 * file arrives from the upload route, so both halves are optional until submit.
 */
type ResourceDraft = {
  title: string;
  document: UploadedDocument | null;
};

function emptyResourceDraft(): ResourceDraft {
  return { title: "", document: null };
}

/**
 * Segmented cleared/not-cleared/awaiting picker. Deliberately not a dropdown —
 * this flag is the thing readers scan for, so it stays visible while writing.
 */
function RoundOutcomePicker({
  value,
  onChange,
  disabled,
}: {
  value: RoundOutcome | undefined;
  onChange: (outcome: RoundOutcome) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {roundOutcomeOptions.map((option) => {
        const meta = roundOutcomeMeta[option];
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={disabled}
            className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
              isActive
                ? `${meta.badge} border-transparent`
                : "text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {meta.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export function ExperienceForm({
  experienceId,
  initialData,
}: {
  experienceId?: string;
  initialData?: ExperienceFormInitialData;
}) {
  const router = useRouter();
  const isEditing = Boolean(experienceId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState(initialData?.companyName ?? "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(
    initialData?.companyLogoUrl ?? null,
  );
  const [role, setRole] = useState(initialData?.role ?? "");
  const [batch, setBatch] = useState(initialData?.batch ?? "");
  const [result, setResult] = useState<(typeof resultOptions)[number]>(
    initialData?.result ?? "Selected",
  );
  const [ctcLpa, setCtcLpa] = useState(initialData?.ctcLpa ?? "");
  const [overview, setOverview] = useState(initialData?.overview ?? "");
  const [preparationResources, setPreparationResources] = useState(
    initialData?.preparationResources ?? "",
  );
  const [jd, setJd] = useState<UploadedDocument | null>(initialData?.jd ?? null);
  const [rounds, setRounds] = useState<ExperienceRoundInput[]>(
    initialData?.rounds.length ? initialData.rounds : [emptyRound(1)],
  );
  const [resources, setResources] = useState<ResourceDraft[]>(
    initialData?.resources.map((resource) => ({
      title: resource.title,
      document: resource.document,
    })) ?? [],
  );

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
    setResources((prev) => [...prev, emptyResourceDraft()]);
  }

  function updateResource(index: number, patch: Partial<ResourceDraft>) {
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function removeResource(index: number) {
    setResources((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // A row with neither a name nor a file is just an empty slot the author
    // added and never filled — drop it silently. A half-filled row is a
    // mistake worth reporting.
    const usedResources = resources.filter((r) => r.title.trim() || r.document);
    const incomplete = usedResources.find((r) => !r.document);
    if (incomplete) {
      toast.error(
        `Upload a PDF or DOCX for "${incomplete.title.trim() || "the new resource"}"`,
      );
      return;
    }

    const resourceInputs: ResourceInput[] = usedResources.map((r) => ({
      title: r.title.trim(),
      url: r.document!.url,
      type: r.document!.type,
      fileName: r.document!.fileName,
      fileSize: r.document!.fileSize,
    }));

    const payload = {
      companyName,
      companyLogoUrl: companyLogoUrl ?? undefined,
      role,
      batch: batch.trim(),
      result,
      ctcLpa: ctcLpa ? Number(ctcLpa) : undefined,
      overview,
      preparationResources: preparationResources || undefined,
      jd: jd ? (jd satisfies UploadedDocumentInput) : undefined,
      rounds,
      resources: resourceInputs,
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updateParsed = updateExperienceSchema.safeParse({
          id: experienceId,
          ...payload,
        });
        if (!updateParsed.success) {
          const errors = updateParsed.error.flatten().fieldErrors;
          const roundErrors = updateParsed.error.flatten().formErrors;
          const first =
            Object.values(errors).flat()[0] ??
            roundErrors[0] ??
            "Validation error";
          toast.error(first);
          return;
        }
        await updateExperience(updateParsed.data);
        toast.success("Experience updated.");
        router.push(`/experiences/${experienceId}`);
      } else {
        const createParsed = createExperienceSchema.safeParse(payload);
        if (!createParsed.success) {
          const errors = createParsed.error.flatten().fieldErrors;
          const roundErrors = createParsed.error.flatten().formErrors;
          const first =
            Object.values(errors).flat()[0] ??
            roundErrors[0] ??
            "Validation error";
          toast.error(first);
          return;
        }
        const experience = await createExperience(createParsed.data);
        toast.success("Experience shared, thank you!");
        router.push(`/experiences/${experience.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update experience"
            : "Failed to share experience",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {isEditing
            ? "Edit Your Placement Experience"
            : "Share Your Placement Experience"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your writeup — changes will remove the verified badge until a coordinator reviews it again."
            : "Help juniors prepare — the whole process, from the aptitude test and OA to the final interview."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="space-y-1.5">
              <Label>
                Logo{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <LogoUpload
                value={companyLogoUrl}
                onChange={setCompanyLogoUrl}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <BatchCombobox
                value={batch}
                onChange={setBatch}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Final Result</Label>
              <Select
                value={result}
                onValueChange={(v) => setResult(v as typeof result)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
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
                CTC (LPA){" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
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
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
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

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start gap-2">
              <Briefcase className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Job Description (JD){" "}
                  <span className="normal-case">(optional)</span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Upload the JD the company shared, as a PDF or DOCX.
                </p>
              </div>
            </div>
            <DocumentUpload
              value={jd}
              onChange={setJd}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Rounds &amp; Stages
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Add every stage you attended — aptitude, OA, coding, GD,
                  interviews — and mark whether you cleared it.
                </p>
              </div>
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

            {rounds.map((round, index) => {
              return (
                <div key={index} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Round {round.roundNumber}
                    </p>
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
                      <Label>Stage</Label>
                      <Select
                        value={round.roundType}
                        onValueChange={(v) =>
                          updateRound(index, {
                            roundType: v as ExperienceRoundInput["roundType"],
                          })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roundTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {roundTypeLabel[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>
                        Difficulty{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
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
                        <SelectTrigger className="w-full">
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

                  <div className="space-y-1.5 border-t border-dashed pt-3">
                    <Label>Did you clear this round?</Label>
                    <RoundOutcomePicker
                      value={round.outcome}
                      onChange={(outcome) => updateRound(index, { outcome })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <Paperclip className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Extra Resources
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Notes, previous papers, prep sheets — upload each as a PDF
                    or DOCX and give it a name.
                  </p>
                </div>
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

            {resources.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-xs">
                No resources added yet.
              </p>
            ) : (
              resources.map((resource, index) => (
                <div key={index} className="space-y-2.5 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Resource name (e.g. Aptitude prep sheet)"
                      value={resource.title}
                      maxLength={100}
                      onChange={(e) =>
                        updateResource(index, { title: e.target.value })
                      }
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                      disabled={isSubmitting}
                      aria-label="Remove resource"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <DocumentUpload
                    compact
                    value={resource.document}
                    onChange={(document) => updateResource(index, { document })}
                    disabled={isSubmitting}
                  />
                </div>
              ))
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Sharing..."
              : isEditing
                ? "Save Changes"
                : "Share Experience"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
