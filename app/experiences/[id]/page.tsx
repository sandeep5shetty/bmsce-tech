import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeCheck,
  Briefcase,
  Download,
  IndianRupee,
  Paperclip,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CompanyAvatar } from "@/features/experiences/components/company-avatar";
import { DeleteExperienceButton } from "@/features/experiences/components/delete-experience-button";
import {
  documentHref,
  documentMeta,
} from "@/features/experiences/components/document-link";
import { ExperienceComments } from "@/features/experiences/components/experience-comments";
import {
  RoundOutcomeBadge,
  RoundProgressRail,
  roundOutcomeMeta,
  toRoundOutcome,
} from "@/features/experiences/components/round-outcome";
import { VerifyExperienceButton } from "@/features/experiences/components/verify-experience-button";
import { getComments, getExperience } from "@/features/experiences/lib/actions";
import {
  RoundType,
  roundTypeLabel,
} from "@/features/experiences/lib/validation";

import { getUser } from "@/actions/user";

const resultColor: Record<string, string> = {
  Selected: "bg-emerald-500 text-white hover:bg-emerald-600",
  Rejected: "bg-red-500 text-white hover:bg-red-600",
  Waitlisted: "bg-amber-500 text-white hover:bg-amber-600",
  "In Process": "bg-sky-500 text-white hover:bg-sky-600",
};

const dotColor: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-red-500",
};

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [experience, currentUser] = await Promise.all([
    getExperience(id),
    getUser(),
  ]);

  if (!experience) notFound();

  const comments = await getComments(id);

  const isAuthor = currentUser?.id === experience.authorId;

  const outcomes = experience.rounds.map((round) =>
    toRoundOutcome(round.outcome),
  );
  const hasOutcomes = outcomes.some((o) => o !== null);
  const clearedCount = outcomes.filter((o) => o === "Cleared").length;

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-5xl space-y-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <CompanyAvatar
            companyName={experience.companyName}
            logoUrl={experience.companyLogoUrl}
            size="h-14 w-14 rounded-2xl text-xl"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-normal">
                {experience.companyName}
              </h1>
              <Badge className={resultColor[experience.result] ?? ""}>
                {experience.result}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {experience.role} &middot; Batch {experience.batch}
              {experience.ctcLpa && (
                <span className="ml-1 inline-flex items-center">
                  &middot;
                  <IndianRupee className="mx-1 h-3.5 w-3.5" />
                  {experience.ctcLpa} LPA
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={experience.author.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(experience.author.name ?? "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {experience.author.name ?? "Anonymous"}
              </span>
            </div>
          </div>
        </div>
        {/* Verified sits top-right, in green, so it reads as an endorsement of
            the whole writeup rather than another inline tag next to the title. */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {experience.isVerified && (
            <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          )}
          <div className="flex gap-2">
            {currentUser?.isCoordinator && (
              <VerifyExperienceButton
                id={experience.id}
                isVerified={experience.isVerified}
              />
            )}
            {isAuthor && <DeleteExperienceButton id={experience.id} />}
          </div>
        </div>
      </div>

      {/* At-a-glance progress strip: how far this candidate got, before any reading. */}
      {hasOutcomes && (
        <div className="bg-card rounded-xl border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">
              {clearedCount} of {experience.rounds.length} round
              {experience.rounds.length !== 1 ? "s" : ""} cleared
            </p>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {(["Cleared", "Not Cleared", "Awaiting Result"] as const).map(
                (outcome) => (
                  <span key={outcome} className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${roundOutcomeMeta[outcome].rail}`}
                    />
                    {roundOutcomeMeta[outcome].label}
                  </span>
                ),
              )}
            </div>
          </div>
          <RoundProgressRail outcomes={outcomes} className="mt-3" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {experience.overview}
              </p>
            </CardContent>
          </Card>

          {experience.preparationResources && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Preparation Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {experience.preparationResources}
                </p>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold">Rounds &amp; Stages</h2>
            <div className="relative space-y-6 border-l-2 pl-6">
              {experience.rounds.map((round) => {
                const outcome = toRoundOutcome(round.outcome);
                return (
                  <div key={round.id} className="relative">
                    {/* Same plain dot the timeline has always used — coloured by
                        outcome, falling back to difficulty for rounds saved
                        before outcomes existed. */}
                    <span
                      className={`ring-background absolute top-1 -left-[27px] h-4 w-4 rounded-full ring-4 ${
                        outcome
                          ? roundOutcomeMeta[outcome].dot
                          : round.difficulty
                            ? (dotColor[round.difficulty] ??
                              "bg-muted-foreground")
                            : "bg-muted-foreground"
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        Round {round.roundNumber} &middot;{" "}
                        {roundTypeLabel[round.roundType as RoundType] ??
                          round.roundType}
                      </span>
                      {outcome && <RoundOutcomeBadge outcome={outcome} />}
                      {round.difficulty && (
                        <Badge variant="secondary" className="text-[10px]">
                          {round.difficulty}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                      {round.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {experience.jdUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Briefcase className="h-4 w-4" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={documentHref(experience.jdUrl, experience.jdFileName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:border-primary/40 hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  {(() => {
                    const meta = documentMeta(
                      experience.jdFileName?.toLowerCase().endsWith(".docx")
                        ? "docx"
                        : "pdf",
                    );
                    const Icon = meta.icon;
                    return (
                      <>
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.classes}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {experience.jdFileName ?? "Job description"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {meta.label} &middot; Open
                          </p>
                        </div>
                        <Download className="text-muted-foreground h-4 w-4 shrink-0" />
                      </>
                    );
                  })()}
                </a>
              </CardContent>
            </Card>
          )}

          {experience.resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Paperclip className="h-4 w-4" />
                  Extra Resources ({experience.resources.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {experience.resources.slice(0, 4).map((resource) => {
                  const meta = documentMeta(resource.type);
                  const Icon = meta.icon;
                  return (
                    <a
                      key={resource.id}
                      href={documentHref(resource.content, resource.fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-2 border-b py-2 text-sm transition-colors last:border-b-0"
                    >
                      <Icon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{resource.title}</span>
                    </a>
                  );
                })}
                {experience.resources.length > 4 && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    <Link href={`/experiences/${experience.id}/resources`}>
                      View all {experience.resources.length} resources
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ExperienceComments
        experienceId={experience.id}
        authorId={experience.authorId}
        currentUserId={currentUser?.id ?? null}
        isCoordinator={currentUser?.isCoordinator ?? false}
        initialComments={comments}
      />
    </div>
  );
}
