import { Badge } from "@/components/ui/badge";

import { RoundOutcome } from "../lib/validation";

/** Difficulty fallback colours for legacy rounds without an outcome recorded. */
export const difficultyMeta: Record<string, { dot: string }> = {
  Easy: { dot: "bg-emerald-500" },
  Medium: { dot: "bg-amber-500" },
  Hard: { dot: "bg-red-500" },
};

/**
 * Single source of truth for how a round outcome looks — the card, the detail
 * timeline and the example showcase all read from here so "Cleared" is the
 * same green everywhere.
 */
export const roundOutcomeMeta: Record<
  RoundOutcome,
  {
    label: string;
    shortLabel: string;
    badge: string;
    dot: string;
    rail: string;
  }
> = {
  Cleared: {
    label: "Cleared",
    shortLabel: "Cleared",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
    dot: "bg-emerald-500",
    rail: "bg-emerald-500",
  },
  "Not Cleared": {
    label: "Not Cleared",
    shortLabel: "Not cleared",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15",
    dot: "bg-red-500",
    rail: "bg-red-500",
  },
  "Awaiting Result": {
    label: "Awaiting Result",
    shortLabel: "Awaiting",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15",
    dot: "bg-amber-500",
    rail: "bg-amber-500",
  },
};

/** Narrows a nullable DB string to a known outcome, or null for legacy rows. */
export function toRoundOutcome(value: string | null): RoundOutcome | null {
  return value && value in roundOutcomeMeta ? (value as RoundOutcome) : null;
}

export function RoundOutcomeBadge({
  outcome,
  className = "",
}: {
  outcome: RoundOutcome;
  className?: string;
}) {
  const meta = roundOutcomeMeta[outcome];
  return <Badge className={`${meta.badge} ${className}`}>{meta.label}</Badge>;
}

/**
 * Compact segmented rail — one segment per round, coloured by outcome. Gives
 * the "how far did they get" read in a single glance on a listing card.
 */
export function RoundProgressRail({
  outcomes,
  className = "",
}: {
  outcomes: (RoundOutcome | null)[];
  className?: string;
}) {
  if (outcomes.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {outcomes.map((outcome, index) => (
        <span
          key={index}
          title={`Round ${index + 1}: ${outcome ?? "Not recorded"}`}
          className={`h-1.5 flex-1 rounded-full ${
            outcome ? roundOutcomeMeta[outcome].rail : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * "3 of 4 cleared" line for the listing card's meta row.
 */
export function RoundClearedSummary({
  clearedCount,
  totalCount,
  className = "",
}: {
  clearedCount: number;
  totalCount: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {clearedCount} of {totalCount} cleared
    </span>
  );
}
