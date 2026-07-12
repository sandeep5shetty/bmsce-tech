"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, CheckCircle2, Loader2, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ReopenGrantDetailsDialog } from "@/features/elective-polls/components/reopen-grant-details-dialog";
import { ReopenRemarksDialog } from "@/features/elective-polls/components/reopen-remarks-dialog";
import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

import { cn } from "@/lib/utils";

interface NonResponder {
  id: string;
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string | null;
  grant: {
    remarks: string;
    grantedAt: string;
    grantedByName: string | null;
  } | null;
}

interface NonRespondersListProps {
  pollId: string;
  pollStatus: "draft" | "open" | "closed";
}

export function NonRespondersList({
  pollId,
  pollStatus,
}: NonRespondersListProps) {
  const [students, setStudents] = useState<NonResponder[] | null>(null);
  const [search, setSearch] = useState("");
  const [reopenFilter, setReopenFilter] = useState<
    "all" | "reopened" | "not-reopened"
  >("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<NonResponder | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<NonResponder | null>(null);

  const canReopen = pollStatus === "closed";

  async function load() {
    const res = await fetch(
      `/api/elective-polls/v1/polls/${pollId}/non-responders`,
    );
    if (res.ok) {
      const body = await res.json();
      setStudents(body.students ?? []);
    } else {
      setStudents([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (reopenFilter === "reopened" && !s.grant) return false;
      if (reopenFilter === "not-reopened" && s.grant) return false;
      if (!q) return true;
      return `${s.name} ${s.usn} ${s.email}`.toLowerCase().includes(q);
    });
  }, [students, search, reopenFilter]);

  const eligibleForSelection = useMemo(
    () => filtered.filter((s) => !s.grant),
    [filtered],
  );

  const hasReopened = useMemo(
    () => (students ?? []).some((s) => s.grant),
    [students],
  );
  const hasNotReopened = useMemo(
    () => (students ?? []).some((s) => !s.grant),
    [students],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(eligibleForSelection.map((s) => s.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const selectedStudents = useMemo(
    () => (students ?? []).filter((s) => selected.has(s.id)),
    [students, selected],
  );

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/reopen-grants/${revokeTarget.id}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to revoke access");
      }
      toast.success(`Revoked access for ${revokeTarget.name}`);
      setRevokeTarget(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke access",
      );
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      {detailsTarget?.grant && (
        <ReopenGrantDetailsDialog
          open={!!detailsTarget}
          onOpenChange={(open) => !open && setDetailsTarget(null)}
          studentName={detailsTarget.name}
          remarks={detailsTarget.grant.remarks}
          grantedAt={detailsTarget.grant.grantedAt}
          grantedByName={detailsTarget.grant.grantedByName}
        />
      )}
      <ReopenRemarksDialog
        open={reopenDialogOpen}
        onOpenChange={setReopenDialogOpen}
        pollId={pollId}
        students={selectedStudents}
        onSuccess={async () => {
          clearSelection();
          await load();
        }}
      />
      <ConfirmActionDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title={`Revoke access for "${revokeTarget?.name}"?`}
        description={
          revokeTarget?.grant
            ? `Originally granted with the remark: "${revokeTarget.grant.remarks}". They'll no longer be able to submit a response to this closed poll.`
            : "They'll no longer be able to submit a response to this closed poll."
        }
        confirmLabel="Revoke Access"
        onConfirm={handleRevoke}
        loading={revoking}
        destructive
      />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium">
              Not yet responded
              {students && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  ({filtered.length}/{students.length})
                </span>
              )}
            </CardTitle>
            {canReopen && selected.size > 0 && (
              <Button size="sm" onClick={() => setReopenDialogOpen(true)}>
                Reopen for {selected.size} selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          {students && students.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-6">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative max-w-sm min-w-48 flex-1">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search name, USN, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
                {hasReopened && hasNotReopened && (
                  <Select
                    value={reopenFilter}
                    onValueChange={(v) =>
                      setReopenFilter(v as typeof reopenFilter)
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-sm">
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All students</SelectItem>
                      <SelectItem value="reopened">Reopened</SelectItem>
                      <SelectItem value="not-reopened">Not reopened</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {canReopen && eligibleForSelection.length > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Select all
                  </button>
                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {students === null ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : students.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Everyone in this poll&apos;s audience has responded.
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No students match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canReopen && <TableHead className="w-8" />}
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch / Section</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const isSelected = selected.has(s.id);
                    return (
                      <TableRow key={s.id}>
                        {canReopen && (
                          <TableCell>
                            {!s.grant && (
                              <button
                                type="button"
                                onClick={() => toggle(s.id)}
                                aria-label={
                                  isSelected
                                    ? `Deselect ${s.name}`
                                    : `Select ${s.name}`
                                }
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
                              </button>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-sm">{s.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.usn}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.email}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.batch}
                          {s.section ? ` / ${s.section}` : ""}
                        </TableCell>
                        <TableCell>
                          {s.grant && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailsTarget(s)}
                                aria-label={`View reopen details for ${s.name}`}
                              >
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer border-green-500/40 text-xs text-green-700 transition-colors hover:bg-green-500/10 dark:text-green-400"
                                >
                                  Reopened
                                </Badge>
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokeTarget(s)}
                                aria-label={`Revoke access for ${s.name}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
