"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useReducedMotion,
} from "motion/react";

import type { LeaderboardEntry } from "@/features/quiz/lib/types";

import { QuizAvatar } from "./quiz-avatar";

const ease = [0.4, 0, 0.2, 1] as const;
const layoutTransition = { duration: 0.5, ease };

function rankLabel(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function AnimatedScore({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = to;

    if (reducedMotion || from === to) {
      setDisplay(to);
      return;
    }

    const controls = animate(from, to, {
      duration: 0.5,
      ease,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });

    return () => controls.stop();
  }, [value, reducedMotion]);

  return <p className={className}>{display.toLocaleString()}</p>;
}

function ScoreDelta({ delta }: { delta: number }) {
  const reducedMotion = useReducedMotion();

  if (delta <= 0) return null;

  if (reducedMotion) {
    return <p className="text-xs font-medium text-green-600">+{delta}</p>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={delta}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 2 }}
        transition={{ duration: 0.25, ease }}
        className="text-xs font-medium text-green-600"
      >
        +{delta}
      </motion.p>
    </AnimatePresence>
  );
}

function LeaderboardRow({
  entry,
  variant,
  highlightParticipantId,
}: {
  entry: LeaderboardEntry;
  variant: "presenter" | "participant";
  highlightParticipantId?: string | null;
}) {
  const reducedMotion = useReducedMotion();
  const isPresenter = variant === "presenter";
  const isMe = highlightParticipantId === entry.participantId;

  const rowClass = isPresenter
    ? "flex items-center gap-4 rounded-xl border bg-card px-4 py-3"
    : `flex items-center gap-3 rounded-xl border px-4 py-3 ${
        isMe
          ? "border-primary bg-primary/10 ring-2 ring-primary"
          : "bg-card"
      }`;

  const rankClass = isPresenter
    ? "text-2xl font-black text-muted-foreground w-8 text-center"
    : "text-lg font-black w-8 text-center text-muted-foreground";

  const nameClass = isPresenter
    ? "flex-1 font-semibold truncate"
    : "flex-1 font-semibold truncate text-sm";

  const scoreClass = isPresenter ? "font-bold" : "font-bold text-sm";

  return (
    <motion.div
      layout={!reducedMotion}
      transition={layoutTransition}
      className={rowClass}
    >
      <motion.span
        layout={!reducedMotion}
        className={rankClass}
        transition={layoutTransition}
      >
        {rankLabel(entry.rank)}
      </motion.span>
      <QuizAvatar emoji={entry.avatar} size={isPresenter ? "2xl" : "xl"} />
      <span className={nameClass}>
        {entry.displayName}
        {!isPresenter && isMe ? " (you)" : ""}
      </span>
      <div className="text-right">
        <AnimatedScore value={entry.totalScore} className={scoreClass} />
        <ScoreDelta delta={entry.scoreDelta} />
      </div>
    </motion.div>
  );
}

export function QuizQuestionLeaderboard({
  entries,
  variant,
  highlightParticipantId = null,
  showWaitingHint = false,
  className = "",
}: {
  entries: LeaderboardEntry[];
  variant: "presenter" | "participant";
  highlightParticipantId?: string | null;
  showWaitingHint?: boolean;
  className?: string;
}) {
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          a.rank - b.rank ||
          a.totalScore - b.totalScore ||
          a.displayName.localeCompare(b.displayName),
      ),
    [entries],
  );

  const isPresenter = variant === "presenter";
  const top10 = isPresenter ? sorted : sorted.slice(0, 10);
  const myEntry = highlightParticipantId
    ? sorted.find((e) => e.participantId === highlightParticipantId)
    : undefined;
  const myRankInTop10 = top10.some(
    (e) => e.participantId === highlightParticipantId,
  );

  const outerClass = isPresenter
    ? `flex-1 max-w-2xl mx-auto w-full px-6 py-8 space-y-6 ${className}`
    : `min-h-screen flex flex-col bg-background px-4 py-8 space-y-6 ${className}`;

  const listClass = isPresenter
    ? "space-y-2"
    : "space-y-2 max-w-sm mx-auto w-full";

  const titleClass = isPresenter
    ? "text-2xl font-bold"
    : "text-2xl font-bold text-center";

  return (
    <div className={outerClass}>
      <h2 className={titleClass}>Leaderboard</h2>
      <LayoutGroup>
        <div className={listClass}>
          {top10.map((entry) => (
            <LeaderboardRow
              key={entry.participantId}
              entry={entry}
              variant={variant}
              highlightParticipantId={highlightParticipantId}
            />
          ))}

          {!isPresenter && myEntry && !myRankInTop10 && (
            <>
              <div className="py-1 text-center text-sm text-muted-foreground">
                …
              </div>
              <LeaderboardRow
                entry={myEntry}
                variant={variant}
                highlightParticipantId={highlightParticipantId}
              />
            </>
          )}
        </div>
      </LayoutGroup>
      {showWaitingHint && (
        <p className="text-center text-sm text-muted-foreground">
          Waiting for host…
        </p>
      )}
    </div>
  );
}
