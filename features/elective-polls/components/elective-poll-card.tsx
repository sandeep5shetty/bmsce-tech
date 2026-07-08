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
import { Separator } from "@/components/ui/separator";
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
  onDeleted: (id: string) => void;
}

const STATUS_VARIANT = {
  draft: "secondary",
  open: "default",
  closed: "outline",
} as const;

export function ElectivePollCard({
  id,
  title,
  status,
  options,
  audienceLabel,
  hasResponses,
  onDeleted,
}: ElectivePollCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalSeats = options.reduce((sum, o) => sum + o.capacity, 0);
  const totalTaken = options.reduce((sum, o) => sum + o.seatsTaken, 0);

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
      <Card className="transition-shadow hover:shadow-md">
        <Link href={`/elective-polls/${id}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
              <Badge variant="outline">
                {options.length} option{options.length !== 1 ? "s" : ""}
              </Badge>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground text-xs">
                {totalTaken}/{totalSeats} seats filled
              </span>
              <span className="text-muted-foreground text-xs">
                · {audienceLabel}
              </span>
            </div>
          </CardContent>
        </Link>
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
      </Card>
    </>
  );
}
