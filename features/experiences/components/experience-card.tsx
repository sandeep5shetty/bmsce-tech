import Link from "next/link";

import {
  BadgeCheck,
  IndianRupee,
  Layers,
  MessageSquare,
  Paperclip,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { companyGradient, companyInitial } from "../lib/company-color";
import { ExperienceListItem } from "../lib/types";

const barColor: Record<string, string> = {
  Selected: "from-emerald-500 to-emerald-500/40",
  Rejected: "from-red-500 to-red-500/40",
  Waitlisted: "from-amber-500 to-amber-500/40",
};

const resultColor: Record<string, string> = {
  Selected:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
  Rejected: "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15",
  Waitlisted:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15",
};

export function ExperienceCard({
  experience,
}: {
  experience: ExperienceListItem;
}) {
  return (
    <Link href={`/experiences/${experience.id}`} className="group block h-full">
      <div className="bg-card relative flex h-full flex-col overflow-hidden rounded-xl border p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-lg">
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${
            barColor[experience.result] ?? "from-muted to-muted"
          }`}
        />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-base font-extrabold text-white ${companyGradient(
                experience.companyName,
              )}`}
            >
              {companyInitial(experience.companyName)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold">
                  {experience.companyName}
                </span>
                {experience.isVerified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                )}
              </div>
              <p className="text-muted-foreground text-sm">{experience.role}</p>
            </div>
          </div>
          <Badge className={`shrink-0 ${resultColor[experience.result] ?? ""}`}>
            {experience.result}
          </Badge>
        </div>

        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-dashed pt-3 text-xs">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {experience.roundCount} round{experience.roundCount !== 1 ? "s" : ""}
          </span>
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
