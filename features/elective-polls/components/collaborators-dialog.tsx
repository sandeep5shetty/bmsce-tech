"use client";

import { useEffect, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

import { AdminMultiPicker, type AdminOption } from "./admin-multi-picker";

interface Collaborator {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  hasAccount: boolean;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
  respondedAt: string | null;
  invitedByName: string | null;
}

interface CollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  isCreator: boolean;
  currentUserEmail: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
}

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Collaborator",
  declined: "Declined",
} as const;

const STATUS_VARIANT = {
  pending: "secondary",
  accepted: "default",
  declined: "outline",
} as const;

export function CollaboratorsDialog({
  open,
  onOpenChange,
  pollId,
  isCreator,
  currentUserEmail,
  creatorName,
  creatorEmail,
}: CollaboratorsDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(
    null,
  );
  const [selected, setSelected] = useState<AdminOption[]>([]);
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Collaborator | null>(null);
  const [removing, setRemoving] = useState(false);

  async function load() {
    const res = await fetch(
      `/api/elective-polls/v1/polls/${pollId}/collaborators`,
    );
    if (res.ok) {
      const body = await res.json();
      setCollaborators(body.collaborators ?? []);
    } else {
      setCollaborators([]);
    }
  }

  useEffect(() => {
    if (open) {
      setSelected([]);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pollId]);

  const excludeEmails = useMemo(() => {
    const emails = new Set<string>();
    if (currentUserEmail) emails.add(currentUserEmail.toLowerCase());
    if (creatorEmail) emails.add(creatorEmail.toLowerCase());
    for (const c of collaborators ?? []) {
      if (c.status !== "declined") emails.add(c.email.toLowerCase());
    }
    return emails;
  }, [collaborators, currentUserEmail, creatorEmail]);

  async function handleInvite() {
    if (selected.length === 0) return;
    setInviting(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/collaborators`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: selected.map((s) => s.email) }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to send invites");
      }
      toast.success(
        `Invited ${selected.length} admin${selected.length === 1 ? "" : "s"}`,
      );
      setSelected([]);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invites",
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/collaborators/${removeTarget.id}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to remove");
      }
      toast.success(
        removeTarget.status === "pending"
          ? `Cancelled invite to ${removeTarget.name ?? removeTarget.email}`
          : `Removed ${removeTarget.name ?? removeTarget.email}`,
      );
      setRemoveTarget(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <ConfirmActionDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={
          removeTarget?.status === "pending"
            ? `Cancel invite to "${removeTarget?.name ?? removeTarget?.email}"?`
            : `Remove "${removeTarget?.name ?? removeTarget?.email}"?`
        }
        description={
          removeTarget?.status === "pending"
            ? "This pending invite will be cancelled. You can invite them again later."
            : "They'll immediately lose access to manage this poll."
        }
        confirmLabel={
          removeTarget?.status === "pending" ? "Cancel Invite" : "Remove"
        }
        onConfirm={handleRemove}
        loading={removing}
        destructive
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Collaborators</DialogTitle>
            <DialogDescription>
              Elective-poll admins with access to manage this poll.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {creatorName ?? creatorEmail}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {creatorEmail}
                </p>
              </div>
              <Badge>Owner</Badge>
            </div>

            {collaborators === null ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              collaborators
                .filter((c) => c.status !== "declined")
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.name ?? c.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {c.name ? c.email : null}

                        {c.invitedByName && (
                          <>
                            <br />· invited by {c.invitedByName}
                          </>
                        )}

                        {!c.hasAccount && (
                          <span className="text-amber-600 dark:text-amber-500">
                            {" "}
                            · Hasn&apos;t signed in yet
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={STATUS_VARIANT[c.status]}>
                        {STATUS_LABEL[c.status]}
                      </Badge>
                      {isCreator && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveTarget(c)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {c.status === "pending" ? "Cancel" : "Remove"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>

          <Separator />

          <div className="space-y-2.5">
            <p className="text-sm font-medium">Invite more collaborators</p>
            <AdminMultiPicker
              value={selected}
              onChange={setSelected}
              excludeEmails={excludeEmails}
              disabled={inviting}
            />
            <Button
              className="w-full"
              onClick={handleInvite}
              disabled={selected.length === 0 || inviting}
            >
              {inviting && <Spinner size="sm" />}
              Send Invite{selected.length === 1 ? "" : "s"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
