import { Briefcase, FileText, MessageSquare, Paperclip } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { RoundType, roundTypeLabel } from "../lib/validation";
import { documentMeta } from "./document-link";
import {
  RoundOutcomeBadge,
  RoundProgressRail,
  roundOutcomeMeta,
} from "./round-outcome";

const exampleRounds = [
  {
    id: "r1",
    roundNumber: 1,
    roundType: "Aptitude",
    difficulty: "Easy",
    outcome: "Cleared",
    description:
      "30 quant + logical reasoning questions in 40 minutes. Speed matters far more than difficulty here — practise time-boxing.",
  },
  {
    id: "r2",
    roundNumber: 2,
    roundType: "OA",
    difficulty: "Medium",
    outcome: "Cleared",
    description:
      "2 DSA problems on HackerRank — array manipulation and a graph traversal question. 90 minutes, proctored.",
  },
  {
    id: "r3",
    roundNumber: 3,
    roundType: "Technical",
    difficulty: "Hard",
    outcome: "Cleared",
    description:
      "Deep dive into DP, asked to optimize a brute-force solution live. Also discussed a past project in detail.",
  },
  {
    id: "r4",
    roundNumber: 4,
    roundType: "HR",
    difficulty: "Easy",
    outcome: "Awaiting Result",
    description:
      "Standard behavioral questions, why Google, and a chance to ask questions back.",
  },
] as const;

const exampleResources = [
  { id: "res1", type: "pdf", title: "DSA sheet used for prep", size: "1.2 MB" },
  {
    id: "res2",
    type: "docx",
    title: "Aptitude formula cheat sheet",
    size: "340 KB",
  },
  {
    id: "res3",
    type: "pdf",
    title: "Behavioral answers I prepared",
    size: "180 KB",
  },
] as const;

const exampleComments = [
  {
    id: "c1",
    name: "Jay D.",
    isAuthor: false,
    body: "How strict was the time limit on the OA? Did you get to finish both problems?",
  },
  {
    id: "c2",
    name: "Rahul K.",
    isAuthor: true,
    body: "Finished both with ~10 min to spare — the graph one took longer than expected, don't panic if you're slow on it.",
  },
] as const;

const exampleOutcomes = exampleRounds.map((round) => round.outcome);
const exampleClearedCount = exampleOutcomes.filter(
  (outcome) => outcome === "Cleared",
).length;

export function ExperienceShowcase() {
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-3xl font-normal">
            Inside an Experience
          </h2>
          <Badge variant="secondary" className="text-[10px]">
            Example
          </Badge>
        </div>
        <span className="text-muted-foreground text-sm">
          Google &middot; SDE Intern
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-emerald-500 text-sm font-extrabold text-white">
                G
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">Rounds &amp; Stages</CardTitle>
                <p className="text-muted-foreground text-xs">
                  {exampleClearedCount} of {exampleRounds.length} rounds cleared
                </p>
              </div>
            </div>
            <RoundProgressRail outcomes={exampleOutcomes} className="mt-3" />
          </CardHeader>
          <CardContent>
            <div className="relative space-y-5 border-l-2 pl-6">
              {exampleRounds.map((round) => {
                const meta = roundOutcomeMeta[round.outcome];
                return (
                  <div key={round.id} className="relative">
                    <span
                      className={`ring-background absolute top-1 -left-[27px] h-3.5 w-3.5 rounded-full ring-4 ${meta.dot}`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        Round {round.roundNumber} &middot;{" "}
                        {roundTypeLabel[round.roundType as RoundType]}
                      </span>
                      <RoundOutcomeBadge outcome={round.outcome} />
                      <Badge variant="secondary" className="text-[10px]">
                        {round.difficulty}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {round.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Briefcase className="h-4 w-4" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    google-sde-intern-jd.pdf
                  </p>
                  <p className="text-muted-foreground text-xs">
                    PDF &middot; 240 KB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Paperclip className="h-4 w-4" />
                Extra Resources (3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {exampleResources.map((resource) => {
                const meta = documentMeta(resource.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-2 border-b py-2 text-sm last:border-b-0"
                  >
                    <Icon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {resource.title}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {resource.size}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <MessageSquare className="h-4 w-4" />
                Ask the Senior (2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exampleComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {comment.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted min-w-0 flex-1 rounded-xl rounded-tl-sm px-2.5 py-1.5">
                    <p className="text-xs font-medium">
                      {comment.name}
                      {comment.isAuthor && (
                        <span className="text-primary ml-1.5">Author</span>
                      )}
                    </p>
                    <p className="text-xs">{comment.body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
