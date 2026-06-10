"use client";

import { ArrowRight, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SessionControlBarProps {
  onNext?: () => void;
  onEnd?: () => void;
  advancing?: boolean;
  ending?: boolean;
  error?: string | null;
  showNext?: boolean;
  showEnd?: boolean;
  nextLabel?: string;
  compact?: boolean;
}

export function SessionControlBar({
  onNext,
  onEnd,
  advancing = false,
  ending = false,
  error = null,
  showNext = false,
  showEnd = false,
  nextLabel = "Next",
  compact = false,
}: SessionControlBarProps) {
  if (!showNext && !showEnd && !error) return null;

  if (compact) {
    return (
      <div className="site-theme flex items-center gap-2">
        {showEnd && onEnd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEnd}
            disabled={ending || advancing}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {ending ? (
              <>
                <Spinner size="sm" className="text-destructive" />
                Ending…
              </>
            ) : (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                End Session
              </>
            )}
          </Button>
        )}

        {showNext && onNext && (
          <Button type="button" size="sm" onClick={onNext} disabled={advancing || ending}>
            {advancing ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Loading…
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="site-theme bg-card/95 sticky top-0 z-20 shrink-0 border-b backdrop-blur-sm">
      <div className="flex h-12 items-center justify-end gap-2 px-3 md:h-14 md:px-4">
        {error ? (
          <p role="alert" className="text-destructive mr-auto truncate text-sm">
            {error}
          </p>
        ) : (
          <div className="mr-auto" />
        )}

        {showEnd && onEnd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEnd}
            disabled={ending || advancing}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {ending ? (
              <>
                <Spinner size="sm" className="text-destructive" />
                Ending…
              </>
            ) : (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                End Session
              </>
            )}
          </Button>
        )}

        {showNext && onNext && (
          <Button type="button" size="sm" onClick={onNext} disabled={advancing || ending}>
            {advancing ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Loading…
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
