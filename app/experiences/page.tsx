import Link from "next/link";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ExperienceBrowser } from "@/features/experiences/components/experience-browser";
import { ExperienceShowcase } from "@/features/experiences/components/experience-showcase";
import { getAllExperiences, getExperienceStats } from "@/features/experiences/lib/actions";

export const dynamic = "force-dynamic";

export default async function ExperiencesPage() {
  const [experiences, stats] = await Promise.all([
    getAllExperiences(),
    getExperienceStats(),
  ]);

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="from-primary/25 pointer-events-none absolute -top-32 -right-16 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-linear-to-br from-fuchsia-500/20 to-transparent blur-3xl" />

        <div className="relative container mx-auto max-w-6xl px-6 pt-16 pb-10">
          <span className="text-primary bg-primary/10 mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Community Knowledge Base
          </span>
          <h1 className="font-serif max-w-2xl text-5xl leading-[1.02] font-normal">
            Interview Experiences, shared by your seniors.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Real placement writeups, round-by-round breakdowns, and a question
            bank for every company — so you walk in prepared, not guessing.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/experiences/new">＋ Share Your Experience</Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto mb-10 grid max-w-6xl grid-cols-2 gap-3 px-6 sm:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.experienceCount}
          </div>
          <div className="text-muted-foreground text-xs">Experiences shared</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.companyCount}
          </div>
          <div className="text-muted-foreground text-xs">Companies covered</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.resourceCount}
          </div>
          <div className="text-muted-foreground text-xs">
            Resources in the bank
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.commentCount}
          </div>
          <div className="text-muted-foreground text-xs">
            Questions answered
          </div>
        </div>
      </div>

      <div className="container mx-auto mb-16 max-w-6xl px-6">
        <ExperienceBrowser experiences={experiences} />
      </div>

      <div className="container mx-auto mb-32 max-w-6xl px-6">
        <ExperienceShowcase />
      </div>
    </div>
  );
}
