"use client";

import { useState } from "react";

import { BarChart2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

export interface PastSession {
  id: string;
  ended_at: string | null;
}

interface PastSessionsProps {
  eventId: string;
  sessions: PastSession[];
}

export function PastSessions({ eventId, sessions }: PastSessionsProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function handleDelete(sessionId: string) {
    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/quiz/v1/analytics/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error?.message ?? "Failed to delete session.");
        return;
      }
      toast.success("Session deleted");
      setPendingDeleteId(null);
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (sessions.length === 0) return null;

  return (
    <>
      <ConfirmActionDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete session?"
        description="This will permanently delete the session and all of its analytics. This action cannot be undone."
        confirmLabel="Delete Session"
        onConfirm={() => {
          if (pendingDeleteId) return handleDelete(pendingDeleteId);
        }}
        loading={deletingId !== null}
        destructive
      />
      <div className="bg-card divide-y rounded-lg border">
      {sessions.map((session, i) => {
        const endedAt = session.ended_at
          ? new Date(session.ended_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Unknown";
        const deleting = deletingId === session.id;
        return (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">Session {sessions.length - i}</p>
              <p className="text-muted-foreground text-xs">Ended {endedAt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/quiz/events/${eventId}/analytics/${session.id}`}>
                  <BarChart2 className="h-3.5 w-3.5" />
                  View Analytics
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingDeleteId(session.id)}
                disabled={deleting}
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                aria-label={`Delete session ${sessions.length - i}`}
              >
                {deleting ? (
                  <Spinner size="sm" className="text-destructive" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
