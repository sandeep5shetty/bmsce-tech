"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { QRCodeDisplay } from "@/features/quiz/components/qr-code-display";

interface PublishPanelProps {
  eventId: string;
  status: "draft" | "published" | string;
  joinCode: string | null;
  activeSessionId?: string | null;
}

export function PublishPanel({
  eventId,
  status,
  joinCode,
  activeSessionId: initialActiveSessionId,
}: PublishPanelProps) {
  const router = useRouter();
  const [publishLoading, setPublishLoading] = useState(false);
  const [unpublishLoading, setUnpublishLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null | undefined>(
    initialActiveSessionId,
  );

  const joinUrl = joinCode
    ? `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/quiz/join/${joinCode}`
    : null;

  async function handlePublish() {
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/quiz/v1/events/${eventId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to publish event.");
      } else {
        toast.success("Event published", {
          description: "Participants can now join with the code.",
        });
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleUnpublish() {
    setUnpublishLoading(true);
    try {
      const res = await fetch(`/api/quiz/v1/events/${eventId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpublish" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to unpublish event.");
      } else {
        toast.success("Event unpublished");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setUnpublishLoading(false);
    }
  }

  async function handleStartSession() {
    setSessionLoading(true);
    try {
      const res = await fetch("/api/quiz/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to start session.");
      } else {
        toast.success("Session started");
        setActiveSessionId(data.session.id);
        router.push(`/quiz/sessions/${data.session.id}/present`);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSessionLoading(false);
    }
  }

  function handleResumeSession() {
    if (activeSessionId) {
      router.push(`/quiz/sessions/${activeSessionId}/present`);
    }
  }

  async function handleStopSession() {
    if (!activeSessionId) return;
    if (!confirm("Are you sure you want to end this session? This cannot be undone."))
      return;
    setStopLoading(true);
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${activeSessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error?.message ?? "Failed to end session.");
      } else {
        toast.success("Session ended");
        setActiveSessionId(null);
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setStopLoading(false);
    }
  }

  async function handleCopyJoinUrl() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Publish</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status !== "published" ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Publishing generates a join code and QR code so participants can join.
            </p>
            <Button
              onClick={handlePublish}
              disabled={publishLoading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {publishLoading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Publishing…
                </>
              ) : (
                "Publish Event"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Join Code
              </p>
              <p
                className="font-mono text-3xl font-bold tracking-widest"
                aria-label={`Join code: ${joinCode}`}
              >
                {joinCode}
              </p>
            </div>

            {joinUrl && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  QR Code
                </p>
                <QRCodeDisplay
                  url={joinUrl}
                  size={200}
                  alt={`QR code for joining event with code ${joinCode}`}
                />
                <a
                  href={joinUrl}
                  download="quiz-qr.png"
                  className="text-primary inline-block text-xs hover:underline"
                  aria-label="Download QR code image"
                >
                  Download QR code
                </a>
              </div>
            )}

            {joinUrl && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Shareable URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded px-3 py-1.5 font-mono text-sm break-all">
                    {joinUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJoinUrl}
                    aria-label="Copy shareable URL to clipboard"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {activeSessionId && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                A session is already in progress.{" "}
                <button
                  type="button"
                  onClick={handleResumeSession}
                  className="font-semibold underline hover:no-underline"
                >
                  Resume session →
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              {activeSessionId ? (
                <>
                  <Button onClick={handleResumeSession}>Resume Session</Button>
                  <Button
                    variant="destructive"
                    onClick={handleStopSession}
                    disabled={stopLoading}
                  >
                    {stopLoading ? (
                      <>
                        <Spinner size="sm" className="text-destructive-foreground" />
                        Ending…
                      </>
                    ) : (
                      "End Session"
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={handleStartSession} disabled={sessionLoading}>
                  {sessionLoading ? (
                    <>
                      <Spinner size="sm" className="text-primary-foreground" />
                      Starting…
                    </>
                  ) : (
                    "Start Session"
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={unpublishLoading || !!activeSessionId}
                title={
                  activeSessionId
                    ? "End the active session before unpublishing"
                    : undefined
                }
              >
                {unpublishLoading ? (
                  <>
                    <Spinner size="sm" />
                    Unpublishing…
                  </>
                ) : (
                  "Unpublish"
                )}
              </Button>
            </div>

            {activeSessionId && (
              <p className="text-muted-foreground text-xs">
                End the active session to unpublish or delete this event.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
