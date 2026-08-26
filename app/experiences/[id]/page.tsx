import Link from "next/link";
import { notFound } from "next/navigation";

import { BadgeCheck, FileText, IndianRupee, ListChecks, Text, Youtube } from "lucide-react";

import { getUser } from "@/actions/user";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { companyGradient, companyInitial } from "@/features/experiences/lib/company-color";

import { DeleteExperienceButton } from "@/features/experiences/components/delete-experience-button";
import { ExperienceComments } from "@/features/experiences/components/experience-comments";
import { VerifyExperienceButton } from "@/features/experiences/components/verify-experience-button";
import { getComments, getExperience } from "@/features/experiences/lib/actions";

const resultColor: Record<string, string> = {
  Selected: "bg-emerald-500 text-white hover:bg-emerald-600",
  Rejected: "bg-red-500 text-white hover:bg-red-600",
  Waitlisted: "bg-amber-500 text-white hover:bg-amber-600",
};

const dotColor: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-red-500",
};

const resourceIcon = {
  pdf: FileText,
  youtube: Youtube,
  text: Text,
} as const;

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

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-5xl space-y-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-xl font-extrabold text-white ${companyGradient(
              experience.companyName,
            )}`}
          >
            {companyInitial(experience.companyName)}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-normal">
                {experience.companyName}
              </h1>
              <Badge className={resultColor[experience.result] ?? ""}>
                {experience.result}
              </Badge>
              {experience.isVerified && (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
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
              <span className="text-sm">{experience.author.name ?? "Anonymous"}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {currentUser?.isCoordinator && (
            <VerifyExperienceButton
              id={experience.id}
              isVerified={experience.isVerified}
            />
          )}
          {isAuthor && <DeleteExperienceButton id={experience.id} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{experience.overview}</p>
            </CardContent>
          </Card>

          {experience.preparationResources && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preparation Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {experience.preparationResources}
                </p>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold">Interview Rounds</h2>
            <div className="relative space-y-6 border-l-2 pl-6">
              {experience.rounds.map((round) => (
                <div key={round.id} className="relative">
                  <span
                    className={`ring-background absolute top-1 -left-[27px] h-4 w-4 rounded-full ring-4 ${
                      round.difficulty
                        ? (dotColor[round.difficulty] ?? "bg-muted-foreground")
                        : "bg-muted-foreground"
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Round {round.roundNumber} &middot; {round.roundType}
                    </span>
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
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {experience.resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <ListChecks className="h-4 w-4" />
                  Question Bank ({experience.resources.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {experience.resources.slice(0, 4).map((resource) => {
                  const Icon = resourceIcon[resource.type as keyof typeof resourceIcon];
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center gap-2 border-b py-2 text-sm last:border-b-0"
                    >
                      <Icon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {resource.title || `Untitled ${resource.type}`}
                      </span>
                    </div>
                  );
                })}
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <Link href={`/experiences/${experience.id}/question-bank`}>
                    View all resources
                  </Link>
                </Button>
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
