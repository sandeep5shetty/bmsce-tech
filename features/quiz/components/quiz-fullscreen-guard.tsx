"use client";

import { useEffect } from "react";

import Link from "next/link";

import { AlertTriangle, Ban, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { useQuizFullscreen } from "@/features/quiz/hooks/use-quiz-fullscreen";

export type QuizFullscreenState = ReturnType<typeof useQuizFullscreen>;

interface QuizFullscreenGuardProps {
  active: boolean;
  state?: QuizFullscreenState;
}

function OverlayShell({
  children,
  role = "dialog",
  ariaLabel,
}: {
  children: React.ReactNode;
  role?: "dialog" | "alertdialog";
  ariaLabel: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <Card className="w-full max-w-md shadow-lg">{children}</Card>
    </div>
  );
}

export function QuizFullscreenGuard({ active, state }: QuizFullscreenGuardProps) {
  const internal = useQuizFullscreen(state ? false : active);
  const {
    supported,
    showEnterPrompt,
    showStrictWarning,
    isRemoved,
    violation,
    entering,
    handleEnterFullscreen,
    acknowledgeStrictWarning,
    showOverlay,
  } = state ?? internal;

  useEffect(() => {
    document.body.style.overflow = showOverlay ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOverlay]);

  if (!active && !showEnterPrompt && !showStrictWarning && !isRemoved && !violation) {
    return null;
  }

  if (isRemoved) {
    return (
      <OverlayShell role="alertdialog" ariaLabel="Removed from quiz">
        <CardHeader className="space-y-3 text-center">
          <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
            <Ban className="size-7" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif text-xl">Removed from quiz</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You switched tabs or left this window a second time during the quiz.
            You have been removed from this session and can no longer participate.
          </p>
        </CardHeader>
        <CardContent className="pb-6">
          <Button asChild className="h-11 w-full text-base font-semibold">
            <Link href="/quiz/join">Back to Join</Link>
          </Button>
        </CardContent>
      </OverlayShell>
    );
  }

  if (showEnterPrompt) {
    return (
      <OverlayShell ariaLabel="Enter fullscreen to start the quiz">
        <CardHeader className="space-y-3 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
            <Maximize2 className="size-7" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif text-xl">
            Quiz starting — enter fullscreen
          </CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This quiz runs in strict fullscreen. Do not switch tabs, windows, or
            apps until the host ends the session. You get one warning — a second
            switch removes you from the quiz.
          </p>
          {!supported && (
            <p className="text-amber-800 dark:text-amber-200 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
              Fullscreen is limited on this browser. Tap below to enter focus
              mode and keep this page open.
            </p>
          )}
        </CardHeader>
        <CardContent className="pb-6">
          <Button
            type="button"
            className="h-11 w-full text-base font-semibold"
            onClick={handleEnterFullscreen}
            disabled={entering}
          >
            {entering ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Entering…
              </>
            ) : (
              <>
                <Maximize2 className="size-4" aria-hidden="true" />
                Enter Fullscreen
              </>
            )}
          </Button>
        </CardContent>
      </OverlayShell>
    );
  }

  if (showStrictWarning) {
    return (
      <OverlayShell role="alertdialog" ariaLabel="Tab switch warning">
        <CardHeader className="space-y-3 text-center">
          <div className="bg-amber-500/15 text-amber-700 dark:text-amber-300 mx-auto flex size-14 items-center justify-center rounded-full">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif text-xl">Final warning</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You switched away from the quiz tab. This is your{" "}
            <span className="font-semibold text-foreground">only warning</span>.
            If you switch tabs, minimize this window, or open another app again,
            you will be{" "}
            <span className="font-semibold text-destructive">
              removed from the quiz immediately
            </span>
            .
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          <Button
            type="button"
            className="h-11 w-full text-base font-semibold"
            onClick={acknowledgeStrictWarning}
            disabled={entering}
          >
            {entering ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Restoring…
              </>
            ) : (
              "I understand — continue quiz"
            )}
          </Button>
        </CardContent>
      </OverlayShell>
    );
  }

  if (violation) {
    return (
      <OverlayShell role="alertdialog" ariaLabel="Fullscreen required">
        <CardHeader className="space-y-3 text-center">
          <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif text-xl">Return to fullscreen</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You exited fullscreen mode. Re-enter fullscreen to continue the quiz.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          <Button
            type="button"
            className="h-11 w-full text-base font-semibold"
            onClick={handleEnterFullscreen}
            disabled={entering}
          >
            {entering ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Restoring…
              </>
            ) : (
              <>
                <Maximize2 className="size-4" aria-hidden="true" />
                Return to Fullscreen
              </>
            )}
          </Button>
        </CardContent>
      </OverlayShell>
    );
  }

  return null;
}
