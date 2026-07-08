"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  type AudienceDraft,
  AudienceRuleEditor,
  EMPTY_AUDIENCE,
} from "@/features/elective-polls/components/audience-rule-editor";
import { CapacityBadge } from "@/features/elective-polls/components/capacity-badge";
import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

interface PollOption {
  id: string;
  label: string;
  description: string | null;
  capacity: number;
  seatsTaken: number;
  status: "active" | "archived";
}

interface AudienceMember {
  id: string;
  student: {
    id: string;
    name: string;
    usn: string;
    email: string;
    batch: string;
    section: string | null;
  };
}

interface PollDetail {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "open" | "closed";
  options: PollOption[];
  audienceMode: "all" | "group" | "custom";
  audienceRule: { batch: string; section: string | null } | null;
  audienceMembers: AudienceMember[];
  audienceExclusions: AudienceMember[];
}

function OptionEditRow({
  pollId,
  option,
  onChanged,
  onDeleted,
}: {
  pollId: string;
  option: PollOption;
  onChanged: (option: PollOption) => void;
  onDeleted: (optionId: string) => void;
}) {
  const [label, setLabel] = useState(option.label);
  const [capacity, setCapacity] = useState(String(option.capacity));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty =
    label.trim() !== option.label || Number(capacity) !== option.capacity;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/options/${option.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim(),
            capacity: Number(capacity),
          }),
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to update option");
      onChanged(body.option);
      toast.success("Option updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update option",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive() {
    setSaving(true);
    try {
      const nextStatus = option.status === "active" ? "archived" : "active";
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/options/${option.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to update option");
      onChanged(body.option);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update option",
      );
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/options/${option.id}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to delete option");
      onDeleted(option.id);
      toast.success("Option deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete option",
      );
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={saving}
        />
        <Input
          type="number"
          min={1}
          className="w-24"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          disabled={saving}
        />
        <CapacityBadge
          seatsTaken={option.seatsTaken}
          capacity={option.capacity}
        />
      </div>
      <div className="flex items-center gap-2">
        {option.status === "archived" && (
          <Badge variant="outline">Archived</Badge>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={save}
          disabled={!dirty || saving}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleArchive}
          disabled={saving}
        >
          {option.status === "active" ? "Archive" : "Unarchive"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          disabled={saving}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this option?"
        description={
          option.seatsTaken > 0
            ? "This option already has responses and can't be deleted — archive it instead."
            : "This can't be undone."
        }
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={del}
      />
    </div>
  );
}

function AddOptionForm({
  pollId,
  onAdded,
}: {
  pollId: string;
  onAdded: (option: PollOption) => void;
}) {
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!label.trim() || !Number(capacity)) {
      toast.error("Enter a label and a positive capacity");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/options`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim(),
            capacity: Number(capacity),
          }),
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to add option");
      onAdded(body.option);
      setLabel("");
      setCapacity("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add option",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="New option label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        disabled={adding}
      />
      <Input
        type="number"
        min={1}
        placeholder="Seats"
        className="w-24"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        disabled={adding}
      />
      <Button onClick={add} disabled={adding}>
        Add
      </Button>
    </div>
  );
}

export default function EditElectivePollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = typeof params.pollId === "string" ? params.pollId : "";

  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [audience, setAudience] = useState<AudienceDraft>(EMPTY_AUDIENCE);
  const [savingAudience, setSavingAudience] = useState(false);

  useEffect(() => {
    fetch(`/api/elective-polls/v1/polls/${pollId}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.poll) {
          const p = body.poll as PollDetail;
          setPoll(p);
          setTitle(p.title);
          setDescription(p.description ?? "");
          setAudience({
            mode: p.audienceMode,
            rule: p.audienceRule
              ? {
                  batch: p.audienceRule.batch,
                  section: p.audienceRule.section ?? "",
                }
              : null,
            members: p.audienceMembers.map((m) => m.student),
            excludedMembers: p.audienceExclusions.map((m) => m.student),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [pollId]);

  async function saveDetails() {
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/elective-polls/v1/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to update poll");
      setPoll(body.poll);
      toast.success("Poll details updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update poll",
      );
    } finally {
      setSavingDetails(false);
    }
  }

  async function saveAudience() {
    if (audience.mode === "group" && !audience.rule) {
      toast.error("Select a group for a group-targeted poll");
      return;
    }
    if (audience.mode === "custom" && audience.members.length === 0) {
      toast.error("Select at least one student for a custom audience");
      return;
    }
    setSavingAudience(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/audience`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audienceMode: audience.mode,
            audienceRule:
              audience.mode === "group" && audience.rule
                ? {
                    batch: audience.rule.batch.trim(),
                    section: audience.rule.section.trim() || null,
                  }
                : null,
            audienceMemberStudentIds:
              audience.mode === "custom"
                ? audience.members.map((m) => m.id)
                : [],
            audienceExcludedStudentIds:
              audience.mode === "group"
                ? audience.excludedMembers.map((m) => m.id)
                : [],
          }),
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error?.message ?? "Failed to update audience");
      setPoll(body.poll);
      toast.success("Audience updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update audience",
      );
    } finally {
      setSavingAudience(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto mt-8 max-w-3xl px-6 text-center">
        <p className="text-muted-foreground">Poll not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-3xl space-y-6 px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/elective-polls/${pollId}`)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to poll
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Poll details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            onClick={saveDetails}
            disabled={savingDetails || !title.trim()}
          >
            Save details
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.options.map((option) => (
            <OptionEditRow
              key={option.id}
              pollId={pollId}
              option={option}
              onChanged={(updated) =>
                setPoll((p) =>
                  p
                    ? {
                        ...p,
                        options: p.options.map((o) =>
                          o.id === updated.id ? updated : o,
                        ),
                      }
                    : p,
                )
              }
              onDeleted={(optionId) =>
                setPoll((p) =>
                  p
                    ? {
                        ...p,
                        options: p.options.filter((o) => o.id !== optionId),
                      }
                    : p,
                )
              }
            />
          ))}
          {poll.status !== "closed" && (
            <AddOptionForm
              pollId={pollId}
              onAdded={(option) =>
                setPoll((p) =>
                  p ? { ...p, options: [...p.options, option] } : p,
                )
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.status !== "draft" ? (
            <p className="text-muted-foreground text-sm">
              Audience rules can only be changed while the poll is still a
              draft.
            </p>
          ) : (
            <>
              <AudienceRuleEditor
                value={audience}
                onChange={setAudience}
                disabled={savingAudience}
              />
              <Button onClick={saveAudience} disabled={savingAudience}>
                Save audience
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
