"use client";

import { useState } from "react";

import Link from "next/link";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

type ElectivePollStatus = "draft" | "open" | "closed";

interface PollStatusControlProps {
  pollId: string;
  status: ElectivePollStatus;
  onChanged: (poll: { status: ElectivePollStatus }) => void;
}

const STATUS_LABEL: Record<ElectivePollStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

const STATUS_VARIANT: Record<
  ElectivePollStatus,
  "secondary" | "default" | "outline"
> = {
  draft: "secondary",
  open: "default",
  closed: "outline",
};

export function PollStatusControl({
  pollId,
  status,
  onChanged,
}: PollStatusControlProps) {
  const [pending, setPending] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<"open" | "closed" | null>(
    null,
  );

  async function transition(target: "open" | "closed") {
    setPending(true);
    try {
      const res = await fetch(`/api/elective-polls/v1/polls/${pollId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to update status");
      onChanged(body.poll);
      toast.success(target === "open" ? "Poll is now open." : "Poll closed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    } finally {
      setPending(false);
      setConfirmTarget(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
      {status === "draft" && (
        <Button
          size="sm"
          onClick={() => setConfirmTarget("open")}
          disabled={pending}
        >
          Open poll
        </Button>
      )}
      {status === "open" && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setConfirmTarget("closed")}
          disabled={pending}
        >
          Close poll
        </Button>
      )}
      {status === "closed" && (
        <Button size="sm" variant="default" asChild>
          <Link href={`/elective-polls/${pollId}/responses?tab=not-responded`}>
            Reopen
          </Link>
        </Button>
      )}

      <ConfirmActionDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget === "open" ? "Open this poll?" : "Close this poll?"
        }
        description={
          confirmTarget === "open"
            ? "Students in the target audience will immediately be able to submit responses."
            : "Students will no longer be able to submit new responses. You can still selectively reopen it for specific non-responders later, from the Not Responded tab."
        }
        confirmLabel={confirmTarget === "open" ? "Open poll" : "Close poll"}
        destructive={confirmTarget === "closed"}
        loading={pending}
        onConfirm={async () => {
          if (confirmTarget) await transition(confirmTarget);
        }}
      />
    </div>
  );
}
