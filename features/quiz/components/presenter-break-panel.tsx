"use client";

import { AlertTriangle, Pause, Play, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuizAvatar } from "@/features/quiz/components/quiz-avatar";

export interface PresenterBreakParticipant {
  participantId: string;
  displayName: string;
  avatar: string;
  totalScore: number;
  joinedAt: string;
  consecutiveMissedQuestions: number;
}

interface PresenterBreakPanelProps {
  participants: PresenterBreakParticipant[];
  autoPlayMode: boolean;
  autoPlayPaused: boolean;
  onToggleAutoPlayPause: () => void;
  onRemoveParticipant: (participant: PresenterBreakParticipant) => void;
  removingParticipantId: string | null;
}

export function PresenterBreakPanel({
  participants,
  autoPlayMode,
  autoPlayPaused,
  onToggleAutoPlayPause,
  onRemoveParticipant,
  removingParticipantId,
}: PresenterBreakPanelProps) {
  const inactiveParticipants = participants.filter(
    (p) => p.consecutiveMissedQuestions >= 2,
  );

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      {autoPlayMode && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Auto-play
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleAutoPlayPause}
            className="w-full"
          >
            {autoPlayPaused ? (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Resume Auto-play
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                Pause Auto-play
              </>
            )}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {autoPlayPaused
              ? "Automatic transitions are paused. Use Next when ready, or resume auto-play."
              : "The session will advance automatically after each break."}
          </p>
        </div>
      )}

      {inactiveParticipants.length > 0 && (
        <div
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Inactive players
              </p>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                These players did not answer the last 2 questions in a row. You
                can remove them before continuing.
              </p>
            </div>
          </div>
          <ul className="space-y-2" aria-label="Inactive participants">
            {inactiveParticipants.map((p) => (
              <li
                key={p.participantId}
                className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-background/80 px-3 py-2"
              >
                <QuizAvatar emoji={p.avatar} size="sm" />
                <span className="flex-1 truncate text-sm font-medium">
                  {p.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveParticipant(p)}
                  disabled={removingParticipantId === p.participantId}
                  className="rounded-full p-1 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  aria-label={`Remove inactive player ${p.displayName}`}
                >
                  <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Participants ({participants.length})
        </h3>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No participants.</p>
        ) : (
          <div
            className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1"
            role="list"
            aria-label="Session participants"
          >
            {participants.map((p) => {
              const isInactive = p.consecutiveMissedQuestions >= 2;
              return (
                <div
                  key={p.participantId}
                  role="listitem"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isInactive
                      ? "border border-amber-500/30 bg-amber-500/5"
                      : "bg-muted/60"
                  }`}
                >
                  <QuizAvatar emoji={p.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.displayName}</p>
                    {isInactive && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        No answer ×{p.consecutiveMissedQuestions}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {p.totalScore.toLocaleString()} pts
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p)}
                    disabled={removingParticipantId === p.participantId}
                    className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    aria-label={`Remove ${p.displayName}`}
                  >
                    <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
