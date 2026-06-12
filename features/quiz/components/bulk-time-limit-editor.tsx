"use client";

import { useState } from "react";

import { Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BulkTimeLimitEditorProps {
  eventId: string;
  questionCount: number;
  defaultTimeLimit?: number;
}

export function BulkTimeLimitEditor({
  eventId,
  questionCount,
  defaultTimeLimit = 20,
}: BulkTimeLimitEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [timeLimit, setTimeLimit] = useState(defaultTimeLimit);
  const [saving, setSaving] = useState(false);

  if (questionCount === 0) return null;

  async function handleApply() {
    const seconds = Math.round(Number(timeLimit));
    if (!Number.isFinite(seconds) || seconds < 5 || seconds > 120) {
      toast.error("Time limit must be between 5 and 120 seconds.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/bulk-time-limits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time_limit: seconds }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to update timings.");
        return;
      }

      toast.success(
        `Updated time limit to ${seconds}s for ${data.updated_count ?? questionCount} questions`,
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Clock className="mr-1.5 h-4 w-4" />
          Set All Timings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Set Time for All Questions</DialogTitle>
          <DialogDescription>
            Apply the same time limit to all {questionCount} questions in this
            event. Individual questions can still be edited separately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bulk-time-limit">Time limit (seconds)</Label>
          <Input
            id="bulk-time-limit"
            type="number"
            min={5}
            max={120}
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
          />
          <p className="text-muted-foreground text-xs">Between 5 and 120 seconds.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={saving}
            className="site-theme"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying…
              </>
            ) : (
              "Apply to All"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
