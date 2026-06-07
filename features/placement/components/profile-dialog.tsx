"use client";

import { useEffect, useState } from "react";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { upsertProfile } from "../lib/actions";
import { ProfileWithUser } from "../lib/types";
import { upsertProfileSchema } from "../lib/validation";
import { StudentCombobox } from "./student-combobox";

type UserOption = { id: string; name: string | null; email: string };

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProfile?: ProfileWithUser | null;
  users: UserOption[];
  onSuccess: () => void;
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
  destructive,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
  destructive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked
            ? destructive
              ? "bg-destructive"
              : "bg-primary"
            : "bg-input"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function ProfileDialog({
  open,
  onOpenChange,
  editProfile,
  users,
  onSuccess,
}: ProfileDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState(editProfile?.userId ?? "");
  const [hasBacklog, setHasBacklog] = useState(editProfile?.hasBacklog ?? false);
  const [isPlacementEligible, setIsPlacementEligible] = useState(
    editProfile?.isPlacementEligible ?? true,
  );
  const [gender, setGender] = useState(editProfile?.gender ?? "");
  const [category, setCategory] = useState(editProfile?.category ?? "");

  useEffect(() => {
    setSelectedUserId(editProfile?.userId ?? "");
    setHasBacklog(editProfile?.hasBacklog ?? false);
    setIsPlacementEligible(editProfile?.isPlacementEligible ?? true);
    setGender(editProfile?.gender ?? "");
    setCategory(editProfile?.category ?? "");
  }, [editProfile, open]);

  const form = useForm({
    defaultValues: {
      pgCgpa: editProfile?.pgCgpa?.toString() ?? "",
      batch: editProfile?.batch ?? "",
      backlogCount: editProfile?.backlogCount?.toString() ?? "0",
      tenthPercent: editProfile?.tenthPercent?.toString() ?? "0",
      twelthPercent: editProfile?.twelthPercent?.toString() ?? "0",
      degreeType: editProfile?.degreeType ?? "",
      degreeCgpa: editProfile?.degreeCgpa?.toString() ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = upsertProfileSchema.safeParse({
          userId: selectedUserId,
          pgCgpa: Number(value.pgCgpa),
          hasBacklog,
          backlogCount: Number(value.backlogCount) || 0,
          isPlacementEligible,
          batch: value.batch,
          tenthPercent: Number(value.tenthPercent) || 0,
          twelthPercent: Number(value.twelthPercent) || 0,
          degreeType: value.degreeType || undefined,
          degreeCgpa: value.degreeCgpa ? Number(value.degreeCgpa) : undefined,
          gender: (gender as "Male" | "Female" | "Other") || undefined,
          category: (category as "General" | "OBC" | "SC" | "ST") || undefined,
        });
        if (!parsed.success) {
          const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
          toast.error(first ?? "Validation error");
          return;
        }
        await upsertProfile(parsed.data);
        toast.success(editProfile ? "Profile updated." : "Profile added.");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save profile");
      }
    },
  });

  const disabled = form.state.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editProfile ? "Edit Profile" : "Add Student Profile"}</DialogTitle>
          <DialogDescription>
            Set academic and eligibility data for placement checks.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
          className="space-y-5"
        >
          {/* Student */}
          <div className="space-y-2">
            <Label>Student</Label>
            {editProfile ? (
              <p className="text-sm font-medium">
                {editProfile.user.name ?? editProfile.user.email}
              </p>
            ) : (
              <StudentCombobox
                users={users}
                value={selectedUserId}
                onChange={setSelectedUserId}
                disabled={disabled}
              />
            )}
          </div>

          {/* ── Academic ── */}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Academic Data
            </p>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="tenthPercent">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="tenthPercent">10th %</Label>
                    <Input
                      id="tenthPercent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g. 85.5"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="twelthPercent">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="twelthPercent">12th %</Label>
                    <Input
                      id="twelthPercent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g. 82.0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="degreeType">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="degreeType">Prior Degree</Label>
                    <Input
                      id="degreeType"
                      placeholder="e.g. BCA, BSc, BTech"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="degreeCgpa">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="degreeCgpa">Degree CGPA/% <span className="text-muted-foreground font-normal">(opt.)</span></Label>
                    <Input
                      id="degreeCgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 7.2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="pgCgpa">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="pgCgpa">MCA CGPA</Label>
                  <Input
                    id="pgCgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.1"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="batch">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="batch">Batch</Label>
                  <Input
                    id="batch"
                    placeholder="e.g. 2024-26"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* ── Status ── */}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status &amp; Demographics
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="OBC">OBC</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="ST">ST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <Toggle
                label="Has active backlog"
                description="Affects backlog-restricted drives."
                checked={hasBacklog}
                onChange={setHasBacklog}
                disabled={disabled}
                destructive
              />
              <form.Field name="backlogCount">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="backlogCount">Backlog count</Label>
                    <Input
                      id="backlogCount"
                      type="number"
                      min="0"
                      max="100"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <Toggle
              label="Placement eligible"
              description="Uncheck to manually block this student from all drives."
              checked={isPlacementEligible}
              onChange={setIsPlacementEligible}
              disabled={disabled}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={disabled}>
              {disabled ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
