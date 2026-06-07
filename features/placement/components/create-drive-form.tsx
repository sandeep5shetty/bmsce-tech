"use client";

import { useEffect, useMemo, useState } from "react";

import { useForm } from "@tanstack/react-form";
import { Copy, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

import { createDrive } from "../lib/actions";
import { getIneligibilityReasons } from "../lib/eligibility";
import { createDriveSchema } from "../lib/validation";

type ProfileSlim = {
  isPlacementEligible: boolean;
  pgCgpa: number;
  backlogCount: number;
  tenthPercent: number;
  twelthPercent: number;
  degreeCgpa: number | null;
  gender: string | null;
  category: string | null;
};

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
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
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          checked
            ? "bg-primary focus-visible:outline-primary"
            : "bg-input focus-visible:outline-ring"
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

export function CreateDriveForm() {
  const [createdDriveId, setCreatedDriveId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileSlim[]>([]);

  // Controlled state for non-text fields
  const [allowBacklog, setAllowBacklog] = useState(false);
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [minPgCgpa, setMinPgCgpa] = useState("0");
  const [minTenthPercent, setMinTenthPercent] = useState("0");
  const [minTwelthPercent, setMinTwelthPercent] = useState("0");
  const [minDegreeCgpa, setMinDegreeCgpa] = useState("0");
  const [genderAllowed, setGenderAllowed] = useState("All");
  const [categoryAllowed, setCategoryAllowed] = useState("All");

  const driveLink =
    typeof window !== "undefined" && createdDriveId
      ? `${window.location.origin}/placement/drive/${createdDriveId}`
      : "";

  // Fetch profiles for live count preview
  useEffect(() => {
    fetch("/api/placement/profiles")
      .then((r) => r.json())
      .then((data: ProfileSlim[]) => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const eligibleCount = useMemo(() => {
    const criteria = {
      minPgCgpa: Number(minPgCgpa) || 0,
      maxBacklogs: Number(maxBacklogs) || 0,
      minTenthPercent: Number(minTenthPercent) || 0,
      minTwelthPercent: Number(minTwelthPercent) || 0,
      minDegreeCgpa: Number(minDegreeCgpa) || 0,
      genderAllowed,
      categoryAllowed,
    };
    return profiles.filter(
      (p) => getIneligibilityReasons(p, criteria).length === 0,
    ).length;
  }, [profiles, minPgCgpa, maxBacklogs, minTenthPercent, minTwelthPercent, minDegreeCgpa, genderAllowed, categoryAllowed]);

  const form = useForm({
    defaultValues: { title: "", description: "", deadline: "" },
    onSubmit: async ({ value }) => {
      try {
        const parsed = createDriveSchema.safeParse({
          ...value,
          minPgCgpa: Number(minPgCgpa),
          allowBacklog,
          maxBacklogs: Number(maxBacklogs),
          minTenthPercent: Number(minTenthPercent),
          minTwelthPercent: Number(minTwelthPercent),
          minDegreeCgpa: Number(minDegreeCgpa),
          genderAllowed,
          categoryAllowed,
        });
        if (!parsed.success) {
          const errors = parsed.error.flatten().fieldErrors;
          const first = Object.values(errors).flat()[0];
          toast.error(first ?? "Validation error");
          return;
        }
        const drive = await createDrive(parsed.data);
        setCreatedDriveId(drive.id);
        form.reset();
        setAllowBacklog(false);
        setMaxBacklogs("0");
        setMinPgCgpa("0");
        setMinTenthPercent("0");
        setMinTwelthPercent("0");
        setMinDegreeCgpa("0");
        setGenderAllowed("All");
        setCategoryAllowed("All");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create drive",
        );
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;

  return (
    <>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Placement Drive</CardTitle>
          <CardDescription>
            Fill in the details. You&apos;ll get a shareable link to send in WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
            className="space-y-6"
          >
            {/* Basic info */}
            <form.Field name="title">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="title">Company Name</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Google, Infosys, TCS..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Role, package, process details..."
                    rows={3}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="deadline">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="deadline">Registration Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </form.Field>

            {/* ── Academic Criteria ── */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Academic Criteria
                </p>
                {profiles.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                    <Users className="h-3 w-3" />
                    {eligibleCount} / {profiles.length} eligible
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minTenthPercent">Min 10th %</Label>
                  <Input
                    id="minTenthPercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={minTenthPercent}
                    onChange={(e) => setMinTenthPercent(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. 60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minTwelthPercent">Min 12th %</Label>
                  <Input
                    id="minTwelthPercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={minTwelthPercent}
                    onChange={(e) => setMinTwelthPercent(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. 60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minDegreeCgpa">
                  Min Prior Degree CGPA{" "}
                  <span className="text-muted-foreground font-normal">(BCA / BSc / BTech — set 0 to skip)</span>
                </Label>
                <Input
                  id="minDegreeCgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={minDegreeCgpa}
                  onChange={(e) => setMinDegreeCgpa(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g. 6.0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minPgCgpa">Min MCA CGPA</Label>
                <Input
                  id="minPgCgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={minPgCgpa}
                  onChange={(e) => setMinPgCgpa(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g. 6.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender Allowed</Label>
                  <Select value={genderAllowed} onValueChange={setGenderAllowed} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Male">Male only</SelectItem>
                      <SelectItem value="Female">Female only</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Category Allowed</Label>
                  <Select value={categoryAllowed} onValueChange={setCategoryAllowed} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Toggle
                label="Allow students with backlogs"
                description="If off, any backlog count > 0 blocks the student."
                checked={allowBacklog}
                onChange={setAllowBacklog}
                disabled={isSubmitting}
              />

              {allowBacklog && (
                <div className="space-y-1.5">
                  <Label htmlFor="maxBacklogs">Max allowed backlogs</Label>
                  <Input
                    id="maxBacklogs"
                    type="number"
                    min="1"
                    max="100"
                    value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. 2"
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Drive & Get Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success dialog */}
      <Dialog open={!!createdDriveId} onOpenChange={() => setCreatedDriveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drive created!</DialogTitle>
            <DialogDescription>
              Copy the link below and paste it in your WhatsApp group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <p className="flex-1 truncate font-mono text-sm">{driveLink}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(driveLink);
                  toast.success("Link copied!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreatedDriveId(null)}
              >
                Close
              </Button>
              <Button asChild className="flex-1">
                <a href={`/placement/dashboard/${createdDriveId}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Dashboard
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
