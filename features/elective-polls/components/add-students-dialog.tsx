"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, ChevronsUpDown, Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";

interface AddStudentsCandidate {
  id: string;
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string;
  inAudience: boolean;
  hasActiveGrant: boolean;
}

interface AddStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  onSuccess: () => void;
}

/**
 * Full-roster picker for adding specific students to this poll directly —
 * distinct from the Not Responded page's selective reopen, which only
 * covers students already inside the poll's audience. This is for the
 * complementary case: a student missed out of the audience entirely (wrong
 * batch/section, absent from a custom list, excluded), or anyone needing
 * late access to a closed poll. Available whenever the poll isn't a draft.
 */
export function AddStudentsDialog({
  open,
  onOpenChange,
  pollId,
  onSuccess,
}: AddStudentsDialogProps) {
  const [candidates, setCandidates] = useState<AddStudentsCandidate[] | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<AddStudentsCandidate[]>([]);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setRemarks("");
    setCandidates(null);
    fetch(`/api/elective-polls/v1/polls/${pollId}/grant-candidates`)
      .then((r) => r.json())
      .then((body) => setCandidates(body.candidates ?? []))
      .catch(() => setCandidates([]));
  }, [open, pollId]);

  function toggle(c: AddStudentsCandidate) {
    setSelected((prev) =>
      prev.some((s) => s.id === c.id)
        ? prev.filter((s) => s.id !== c.id)
        : [...prev, c],
    );
  }

  function remove(id: string) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );

  async function handleSubmit() {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/reopen-grants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: selected.map((s) => s.id),
            remarks,
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to add students");
      }
      toast.success(
        `Added ${selected.length} student${selected.length === 1 ? "" : "s"} to this poll`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add students",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Students</DialogTitle>
          <DialogDescription>
            Add specific students to this poll even if they were missed from
            its audience, or it&apos;s now closed. A remark is required for
            accountability.
          </DialogDescription>
        </DialogHeader>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={candidates === null}
              className="w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {selected.length > 0
                  ? `${selected.length} student${selected.length === 1 ? "" : "s"} selected`
                  : "Search students..."}
              </span>
              <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search by name, USN, or email..." />
              <CommandList className="max-h-72">
                {candidates === null ? (
                  <div className="text-muted-foreground flex items-center gap-2 p-4 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading roster...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map((c) => {
                        const isSelected = selectedIds.has(c.id);
                        return (
                          <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.usn} ${c.email}`}
                            onSelect={() => toggle(c)}
                            className="cursor-pointer"
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                isSelected
                                  ? "border-green-500 bg-green-500"
                                  : "border-muted-foreground/40",
                              )}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {c.name}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                {c.usn} · {c.batch}/{c.section}
                                {!c.inAudience &&
                                  " · not in this poll's audience"}
                                {c.hasActiveGrant && " · already added"}
                              </p>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <span
                key={s.id}
                className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="hover:bg-destructive/15 hover:text-destructive rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${s.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <Textarea
          placeholder="Explain why you're adding these students (required)…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={submitting}
          rows={3}
        />

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
            disabled={submitting || selected.length === 0 || !remarks.trim()}
          >
            {submitting && <Spinner size="sm" />}
            Add Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
