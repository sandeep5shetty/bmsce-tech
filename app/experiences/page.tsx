import Link from "next/link";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ExperienceBrowser } from "@/features/experiences/components/experience-browser";
import { ExperienceShowcase } from "@/features/experiences/components/experience-showcase";
import {
  getAllExperiences,
  getExperienceStats,
} from "@/features/experiences/lib/actions";
import { CoordinatorSetup } from "@/features/placement/components/coordinator-setup";

import { getUser } from "@/actions/user";

export const dynamic = "force-dynamic";

export default async function ExperiencesPage() {
  const [experiences, stats, currentUser] = await Promise.all([
    getAllExperiences(),
    getExperienceStats(),
    getUser(),
  ]);

  const statTiles = [
    { value: stats.experienceCount, label: "Experiences shared" },
    { value: stats.companyCount, label: "Companies covered" },
    { value: stats.roundCount, label: "Rounds documented" },
    { value: stats.resourceCount, label: "Resources shared" },
    { value: stats.commentCount, label: "Questions answered" },
  ];

  return (
    <div>
      <div className="container mx-auto max-w-6xl px-6 pt-16 pb-10">
          <span className="text-primary bg-primary/10 mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Community Knowledge Base
          </span>
          <h1 className="max-w-2xl font-serif text-5xl leading-[1.02] font-normal">
            Placement Experiences, shared by your seniors.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Every stage of the process — aptitude, OA, coding rounds, GD and
            interviews — with a clear cleared-or-not flag on each round, plus
            the JD and prep resources for every company.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/experiences/new">＋ Share Your Experience</Link>
            </Button>
            {currentUser && !currentUser.isCoordinator && (
              <CoordinatorSetup prominent />
            )}
          </div>
      </div>

      <div className="container mx-auto mb-10 grid max-w-6xl grid-cols-2 gap-3 px-6 sm:grid-cols-3 lg:grid-cols-5">
        {statTiles.map((tile) => (
          <div key={tile.label} className="bg-card rounded-xl border p-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {tile.value}
            </div>
            <div className="text-muted-foreground text-xs">{tile.label}</div>
          </div>
        ))}
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
