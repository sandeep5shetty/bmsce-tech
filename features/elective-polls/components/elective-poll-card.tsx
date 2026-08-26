"use client";

import { useState } from "react";

import Link from "next/link";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

interface ElectivePollCardOption {
  seatsTaken: number;
  capacity: number;
}

interface ElectivePollCardProps {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  options: ElectivePollCardOption[];
  audienceLabel: string;
  hasResponses: boolean;
  role: "owner" | "collaborator";
  onDeleted: (id: string) => void;
}

function seatFillTone(pct: number): string {
  if (pct >= 90) return "from-red-500 to-red-500/60";
  if (pct >= 60) return "from-amber-500 to-amber-500/60";
  return "from-emerald-500 to-emerald-500/60";
}

export function ElectivePollCard({
  id,
  title,
  status,
  options,
  audienceLabel,
  hasResponses,
  role,
  onDeleted,
}: ElectivePollCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalSeats = options.reduce((sum, o) => sum + o.capacity, 0);
  const totalTaken = options.reduce((sum, o) => sum + o.seatsTaken, 0);
  const fillPct = totalSeats > 0 ? Math.round((totalTaken / totalSeats) * 100) : 0;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/elective-polls/v1/polls/${id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to delete poll");
      }
      toast.success(`"${title}" deleted`);
      setConfirmOpen(false);
      onDeleted(id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete poll",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${title}"?`}
        description={
          hasResponses
            ? `This poll already has ${totalTaken} response${totalTaken === 1 ? "" : "s"}. Deleting it will permanently remove the poll AND all of its responses — consider closing it instead if you want to keep the record.`
            : "This will permanently remove the poll and its options. This can't be undone."
        }
        confirmLabel="Delete Poll"
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />
      <Card className="hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <Link href={`/elective-polls/${id}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              {status === "open" ? (
                <Badge className="shrink-0 gap-1.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Open
                </Badge>
              ) : status === "draft" ? (
                <Badge variant="secondary" className="shrink-0">
                  Draft
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0">
                  Closed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {role === "collaborator" && (
                <Badge variant="outline">Collaborator</Badge>
              )}
              <Badge variant="outline">
                {options.length} option{options.length !== 1 ? "s" : ""}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {audienceLabel}
              </span>
            </div>

            <div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full bg-linear-to-r ${seatFillTone(fillPct)}`}
                  style={{ width: `${Math.min(fillPct, 100)}%` }}
                />
              </div>
              <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
                <span>
                  <span className="text-foreground font-semibold">
                    {totalTaken}
                  </span>{" "}
                  / {totalSeats} seats filled
                </span>
                <span>{totalSeats > 0 ? `${fillPct}%` : "—"}</span>
              </div>
            </div>
          </CardContent>
        </Link>
        {role === "owner" && (
          <CardFooter className="justify-end pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              aria-label={`Delete poll: ${title}`}
            >
              {deleting ? (
                <>
                  <Spinner size="sm" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
