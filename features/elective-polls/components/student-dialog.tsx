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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import type { RosterStudentWithUsage } from "@/features/elective-polls/lib/roster-actions";

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editStudent: RosterStudentWithUsage | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  usn: "",
  email: "",
  batch: "",
  section: "",
};

export function StudentDialog({
  open,
  onOpenChange,
  editStudent,
  onSuccess,
}: StudentDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editStudent;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      editStudent
        ? {
            name: editStudent.name,
            usn: editStudent.usn,
            email: editStudent.email,
            batch: editStudent.batch,
            section: editStudent.section,
          }
        : EMPTY_FORM,
    );
  }, [open, editStudent]);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit
          ? `/api/elective-polls/v1/roster/${editStudent.id}`
          : "/api/elective-polls/v1/roster",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to save student");
      }
      toast.success(isEdit ? "Student updated" : "Student added");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this student's roster details."
              : "Add a new student to the roster. They'll become eligible for polls whose audience matches their batch/section."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border-destructive/20 bg-destructive/10 rounded-lg border p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="student-name">Name</Label>
            <Input
              id="student-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="student-usn">USN</Label>
              <Input
                id="student-usn"
                value={form.usn}
                onChange={(e) => updateField("usn", e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={saving}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="student-batch">Batch</Label>
              <Input
                id="student-batch"
                placeholder="e.g. 2025-27"
                value={form.batch}
                onChange={(e) => updateField("batch", e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-section">Section</Label>
              <Input
                id="student-section"
                placeholder="e.g. A"
                value={form.section}
                onChange={(e) => updateField("section", e.target.value)}
                disabled={saving}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner size="sm" />}
              {isEdit ? "Save Changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
