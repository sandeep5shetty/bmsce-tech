import { FileText, ListChecks, MessageSquare, Youtube } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const exampleRounds = [
  {
    id: "r1",
    roundNumber: 1,
    roundType: "OA",
    difficulty: "Medium",
    description:
      "2 DSA problems on HackerRank — array manipulation and a graph traversal question. 90 minutes, proctored.",
  },
  {
    id: "r2",
    roundNumber: 2,
    roundType: "Technical",
    difficulty: "Hard",
    description:
      "Deep dive into DP, asked to optimize a brute-force solution live. Also discussed a past project in detail.",
  },
  {
    id: "r3",
    roundNumber: 3,
    roundType: "Technical",
    difficulty: "Medium",
    description:
      "System design basics — designing a URL shortener, focused on trade-offs rather than exact answers.",
  },
  {
    id: "r4",
    roundNumber: 4,
    roundType: "HR",
    difficulty: "Easy",
    description:
      "Standard behavioral questions, why Google, and a chance to ask questions back.",
  },
] as const;

const exampleResources = [
  { id: "res1", type: "pdf", title: "DSA sheet used for prep" },
  { id: "res2", type: "youtube", title: "System design crash course" },
  { id: "res3", type: "text", title: "Behavioral answers I prepared" },
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

const dotColor: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-red-500",
};

const resourceIcon = {
  pdf: FileText,
  youtube: Youtube,
  text: FileText,
} as const;

export function ExperienceShowcase() {
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-3xl font-normal">Inside an Experience</h2>
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
              <div>
                <CardTitle className="text-base">Interview Rounds</CardTitle>
                <p className="text-muted-foreground text-xs">4 rounds</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-5 border-l-2 pl-6">
              {exampleRounds.map((round) => (
                <div key={round.id} className="relative">
                  <span
                    className={`ring-background absolute top-1 -left-[27px] h-3.5 w-3.5 rounded-full ring-4 ${
                      dotColor[round.difficulty]
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Round {round.roundNumber} &middot; {round.roundType}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {round.difficulty}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {round.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <ListChecks className="h-4 w-4" />
                Question Bank (3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {exampleResources.map((resource) => {
                const Icon = resourceIcon[resource.type];
                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-2 border-b py-2 text-sm last:border-b-0"
                  >
                    <Icon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{resource.title}</span>
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
