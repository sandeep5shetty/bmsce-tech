"use client";

import { useEffect, useRef } from "react";

import { QuizAvatar } from "@/features/quiz/components/quiz-avatar";

export interface QuizLeaderboardEntry {
  rank: number;
  participantId: string;
  displayName: string;
  avatar: string;
  totalScore: number;
  scoreDelta: number;
}

interface QuizFinalLeaderboardProps {
  entries: QuizLeaderboardEntry[];
  /** Highlight this participant in the ranked list below the podium */
  highlightParticipantId?: string | null;
  className?: string;
}

export function QuizFinalLeaderboard({
  entries,
  highlightParticipantId = null,
  className = "",
}: QuizFinalLeaderboardProps) {
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    import("canvas-confetti").then((mod) => {
      const confetti = mod.default;
      const end = Date.now() + 5000;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    });
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div
      className={`flex-1 max-w-2xl mx-auto w-full px-6 py-8 space-y-8 ${className}`}
    >
      <h2 className="text-3xl font-black text-center">🏆 Final Results</h2>

      <div className="flex items-end justify-center gap-4">
        {top3[1] && (
          <div className="flex flex-col items-center gap-2 flex-1">
            <QuizAvatar emoji={top3[1].avatar} size="3xl" />
            <p className="font-bold text-sm text-center truncate w-full">
              {top3[1].displayName}
              {highlightParticipantId === top3[1].participantId ? " (you)" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {top3[1].totalScore.toLocaleString()}
            </p>
            <div className="w-full h-20 rounded-t-xl bg-slate-300 flex items-center justify-center text-3xl font-black">
              🥈
            </div>
          </div>
        )}
        {top3[0] && (
          <div className="flex flex-col items-center gap-2 flex-1">
            <QuizAvatar emoji={top3[0].avatar} size="hero" />
            <p className="font-bold text-sm text-center truncate w-full">
              {top3[0].displayName}
              {highlightParticipantId === top3[0].participantId ? " (you)" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {top3[0].totalScore.toLocaleString()}
            </p>
            <div className="w-full h-28 rounded-t-xl bg-yellow-300 flex items-center justify-center text-3xl font-black">
              🥇
            </div>
          </div>
        )}
        {top3[2] && (
          <div className="flex flex-col items-center gap-2 flex-1">
            <QuizAvatar emoji={top3[2].avatar} size="3xl" />
            <p className="font-bold text-sm text-center truncate w-full">
              {top3[2].displayName}
              {highlightParticipantId === top3[2].participantId ? " (you)" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {top3[2].totalScore.toLocaleString()}
            </p>
            <div className="w-full h-14 rounded-t-xl bg-amber-600 flex items-center justify-center text-3xl font-black">
              🥉
            </div>
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry) => {
            const isMe = highlightParticipantId === entry.participantId;
            return (
              <div
                key={entry.participantId}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  isMe
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "bg-card"
                }`}
              >
                <span className="text-sm font-bold text-muted-foreground w-8 text-center">
                  #{entry.rank}
                </span>
                <QuizAvatar emoji={entry.avatar} size="xl" />
                <span className="flex-1 font-medium truncate">
                  {entry.displayName}
                  {isMe ? " (you)" : ""}
                </span>
                <span className="font-bold">
                  {entry.totalScore.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
