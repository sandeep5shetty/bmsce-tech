import Link from "next/link";

import {
  BadgeCheck,
  Briefcase,
  IndianRupee,
  Layers,
  MessageSquare,
  Paperclip,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { ExperienceListItem } from "../lib/types";
import { CompanyAvatar } from "./company-avatar";
import { RoundClearedSummary, RoundProgressRail } from "./round-outcome";

const barColor: Record<string, string> = {
  Selected: "from-emerald-500 to-emerald-500/40",
  Rejected: "from-red-500 to-red-500/40",
  Waitlisted: "from-amber-500 to-amber-500/40",
  "In Process": "from-sky-500 to-sky-500/40",
};

const resultColor: Record<string, string> = {
  Selected:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
  Rejected: "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15",
  Waitlisted:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15",
  "In Process":
    "bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:bg-sky-500/15",
};

export function ExperienceCard({
  experience,
}: {
  experience: ExperienceListItem;
}) {
  // Legacy experiences have no recorded outcomes — showing "0 of 4 cleared"
  // for them would be a lie, so the summary only appears once at least one
  // round has a verdict.
  const hasOutcomes = experience.roundOutcomes.some((o) => o !== null);

  return (
    <Link href={`/experiences/${experience.id}`} className="group block h-full">
      <div className="bg-card group-hover:border-primary/30 relative flex h-full flex-col overflow-hidden rounded-xl border p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${
            barColor[experience.result] ?? "from-muted to-muted"
          }`}
        />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-start gap-3">
            <CompanyAvatar
              companyName={experience.companyName}
              logoUrl={experience.companyLogoUrl}
              size="h-11 w-11 rounded-xl text-base"
            />
            <div className="min-w-0">
              <span className="block truncate text-base font-bold">
                {experience.companyName}
              </span>
              <p className="text-muted-foreground truncate text-sm">
                {experience.role}
              </p>
            </div>
          </div>
          {/* Verified above the result badge, in green — the old bare check
              icon next to the company name was too easy to miss. */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {experience.isVerified && (
              <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
            <Badge className={resultColor[experience.result] ?? ""}>
              {experience.result}
            </Badge>
          </div>
        </div>

        {hasOutcomes && (
          <RoundProgressRail
            outcomes={experience.roundOutcomes}
            className="mt-4"
          />
        )}

        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-dashed pt-3 text-xs">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {experience.roundCount} round
            {experience.roundCount !== 1 ? "s" : ""}
          </span>
          {hasOutcomes && (
            <RoundClearedSummary
              clearedCount={experience.clearedRoundCount}
              totalCount={experience.roundCount}
            />
          )}
          {experience.jdUrl && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              JD
            </span>
          )}
          {experience.resourceCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {experience.resourceCount} resource
              {experience.resourceCount !== 1 ? "s" : ""}
            </span>
          )}
          {experience.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {experience.commentCount}
            </span>
          )}
          {experience.ctcLpa && (
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {experience.ctcLpa} LPA
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={experience.author.image ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {(experience.author.name ?? "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs">
              {experience.author.name ?? "Anonymous"} &middot; Batch{" "}
              {experience.batch}
            </span>
          </div>
          <span className="text-primary flex items-center gap-1 text-xs font-medium opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
