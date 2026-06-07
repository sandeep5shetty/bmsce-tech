"use client";

import { useState } from "react";

import { CheckCircle, Loader2, User2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { PlacementDrive } from "@/types";

import { submitResponse } from "../lib/actions";
import { EligibilityResult } from "../lib/types";

interface DriveResponseFormProps {
  drive: PlacementDrive;
  currentUser: { id: string; name: string; email: string };
  initialEligibility: EligibilityResult;
}

export function DriveResponseForm({
  drive,
  currentUser,
  initialEligibility,
}: DriveResponseFormProps) {
  const [eligibility, setEligibility] = useState<EligibilityResult>(initialEligibility);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingResponse =
    eligibility.eligible ? eligibility.existingResponse : null;
  const [submitted, setSubmitted] = useState(existingResponse !== null);
  const [submittedChoice, setSubmittedChoice] = useState<boolean | null>(
    existingResponse?.hasRegistered ?? null,
  );

  async function handleSubmit(hasRegistered: boolean) {
    setIsSubmitting(true);
    try {
      await submitResponse({
        driveId: drive.id,
        userId: currentUser.id,
        hasRegistered,
      });
      setSubmitted(true);
      setSubmittedChoice(hasRegistered);
      setEligibility((prev) =>
        prev.eligible
          ? { ...prev, existingResponse: { hasRegistered, submittedAt: new Date() } }
          : prev,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isPastDeadline = new Date() > new Date(drive.deadline);
  const isLocked = drive.isLocked;
  const isClosed = isLocked || isPastDeadline;

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background px-4 py-8 sm:justify-center">
      <div className="w-full max-w-md space-y-6">

        {/* Drive header */}
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
            {drive.title}
          </h1>
          {drive.description && (
            <p className="text-muted-foreground mt-2 text-sm">{drive.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="bg-muted rounded-full px-3 py-1">
              Min MCA CGPA: <strong>{drive.minPgCgpa.toFixed(1)}</strong>
            </span>
            <span className="bg-muted rounded-full px-3 py-1">
              Deadline:{" "}
              <strong>
                {new Date(drive.deadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </span>
            {drive.allowBacklog && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Backlog OK
              </span>
            )}
          </div>
        </div>

        {/* Identity card */}
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              <User2 className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentUser.name}</p>
              <p className="text-muted-foreground truncate text-xs">{currentUser.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Locked / expired notice */}
        {isClosed && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-center">
              <XCircle className="text-destructive mx-auto mb-2 h-8 w-8" />
              <p className="text-destructive font-medium">
                {isLocked
                  ? "This drive is locked."
                  : "The deadline for this drive has passed."}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                No more responses are being accepted.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Response card */}
        {!isClosed && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Superset Registration</CardTitle>
              <CardDescription>
                Have you registered on Superset for{" "}
                <strong>{drive.title}</strong>?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Ineligible */}
              {!eligibility.eligible && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700 dark:text-red-400">
                        Not eligible for this drive
                      </p>
                      <ul className="mt-2 space-y-1">
                        {eligibility.reasons.map((r, i) => (
                          <li key={i} className="text-sm text-red-600 dark:text-red-300">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Already submitted */}
              {eligibility.eligible && submitted && submittedChoice !== null && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Response recorded
                      </p>
                      <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                        You said:{" "}
                        <strong>
                          {submittedChoice
                            ? "Yes, I have registered on Superset"
                            : "No, not yet"}
                        </strong>
                      </p>
                      <button
                        className="mt-2 text-xs text-green-700 underline dark:text-green-400"
                        onClick={() => { setSubmitted(false); setSubmittedChoice(null); }}
                      >
                        Change response
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Eligible + not submitted */}
              {eligibility.eligible && !submitted && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    size="lg"
                    className="h-16 bg-green-600 text-base hover:bg-green-700"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Yes, I registered
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 text-base"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="mr-2 h-5 w-5" />
                        No, not yet
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
