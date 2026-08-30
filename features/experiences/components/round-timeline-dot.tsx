import { RoundOutcome } from "../lib/validation";
import { roundTypeMeta } from "./round-type-meta";

const outcomeTint: Record<
  RoundOutcome,
  { shell: string; icon: string }
> = {
  Cleared: {
    shell: "bg-emerald-500/85",
    icon: "text-neutral-900 dark:text-neutral-800",
  },
  "Not Cleared": {
    shell: "bg-red-500/85",
    icon: "text-gray-900 dark:text-gray-900",
  },
  "Awaiting Result": {
    shell: "bg-amber-500/85",
    icon: "text-neutral-800",
  },
};

const difficultyTint: Record<string, { shell: string; icon: string }> = {
  Easy: {
    shell: "bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  Medium: {
    shell: "bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
  },
  Hard: {
    shell: "bg-red-500/15",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function RoundTimelineDot({
  roundType,
  outcome,
  difficulty,
  size = "md",
}: {
  roundType: string;
  outcome: RoundOutcome | null;
  difficulty?: string | null;
  size?: "sm" | "md";
}) {
  const tint = outcome
    ? outcomeTint[outcome]
    : difficulty && difficulty in difficultyTint
      ? difficultyTint[difficulty]
      : { shell: "bg-muted", icon: "text-muted-foreground" };

  const meta =
    roundType in roundTypeMeta
      ? roundTypeMeta[roundType as keyof typeof roundTypeMeta]
      : roundTypeMeta.Other;
  const Icon = meta.icon;

  const sizeClasses =
    size === "sm"
      ? "top-0.5 -left-[34px] h-6 w-6 ring-[3px]"
      : "top-0 -left-[38px] h-7 w-7 ring-4";

  return (
    <span
      aria-hidden
      className={`ring-background absolute flex items-center justify-center rounded-full ${sizeClasses} ${tint.shell}`}
    >
      <Icon className={`h-3 w-3 ${tint.icon}`} />
    </span>
  );
}
