"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

interface ReopenTarget {
  id: string;
  name: string;
}

interface ReopenRemarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  students: ReopenTarget[];
  onSuccess: () => void;
}

export function ReopenRemarksDialog({
  open,
  onOpenChange,
  pollId,
  students,
  onSuccess,
}: ReopenRemarksDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setRemarks("");
  }, [open]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/reopen-grants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: students.map((s) => s.id),
            remarks,
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to reopen the poll");
      }
      toast.success(
        `Reopened for ${students.length} student${students.length === 1 ? "" : "s"}`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reopen the poll",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reopen for {students.length} student
            {students.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            These students will be able to submit a response even though the
            poll is closed for everyone else. A remark is required for
            accountability.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {students.map((s) => (
            <span
              key={s.id}
              className="bg-muted rounded-full px-3 py-1 text-xs"
            >
              {s.name}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Explain why you're reopening for these students (required)…"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={submitting}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !remarks.trim()}
          >
            {submitting && <Spinner size="sm" />}
            Reopen for {students.length} student
            {students.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
