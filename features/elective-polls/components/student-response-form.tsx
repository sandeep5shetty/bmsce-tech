"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  CapacityBadge,
  SeatBar,
} from "@/features/elective-polls/components/capacity-badge";
import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";
import { createClient } from "@/features/quiz/lib/supabase-client";

import { getUser } from "@/actions/user";

interface PublicOption {
  id: string;
  label: string;
  description: string | null;
  capacity: number;
  seatsTaken: number;
  seatsRemaining: number;
  isFull: boolean;
  status: "active" | "archived";
}

interface PublicPoll {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "open" | "closed";
  options: PublicOption[];
}

interface PublicPollPayload {
  poll: PublicPoll;
  eligible: boolean;
  ineligibleReason: "NOT_IN_ROSTER" | "AUDIENCE_MISMATCH" | null;
  myResponse: { optionId: string } | null;
  /** True when poll.status is "open", OR the responder holds an active
   * reopen grant on an otherwise-closed poll (see reopen-grants.ts). Gate
   * the response UI on this, not poll.status directly, so poll.status stays
   * truthful for display. */
  canRespond: boolean;
  viaReopenGrant: boolean;
}

export function StudentResponseForm({ pollId }: { pollId: string }) {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
  });

  const [data, setData] = useState<PublicPollPayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);

  // Derived, not a separate state flag — a flag defaulting to `true` and
  // only cleared inside load() would stay stuck forever for a logged-out
  // visitor, since load() never runs (and never gets a chance to clear it)
  // when there's no user.
  const stillFetchingPollData = !!user && !data && !notFound;

  async function load() {
    try {
      const res = await fetch(`/api/elective-polls/v1/polls/${pollId}/public`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const body = (await res.json()) as PublicPollPayload;
      setData(body);
    } catch {
      setNotFound(true);
    }
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, user]);

  useEffect(() => {
    // Realtime is an enhancement, not a requirement — the initial /public
    // fetch above (and a manual refresh) already reflect current state, so
    // skip the subscription entirely if Supabase isn't configured rather
    // than throwing.
    if (!user || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    const channel = supabase.channel(`elective-poll:${pollId}`);
    channel
      .on("broadcast", { event: "seat_counts_changed" }, ({ payload }) => {
        const updates = payload.options as Array<{
          id: string;
          seatsTaken: number;
          capacity: number;
          status: "active" | "archived";
        }>;
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            poll: {
              ...prev.poll,
              options: prev.poll.options.map((o) => {
                const update = updates.find((u) => u.id === o.id);
                if (!update) return o;
                return {
                  ...o,
                  seatsTaken: update.seatsTaken,
                  capacity: update.capacity,
                  status: update.status,
                  seatsRemaining: Math.max(
                    update.capacity - update.seatsTaken,
                    0,
                  ),
                  isFull: update.seatsTaken >= update.capacity,
                };
              }),
            },
          };
        });
      })
      .on("broadcast", { event: "poll_status_changed" }, ({ payload }) => {
        const status = payload.status as PublicPoll["status"];
        setData((prev) =>
          prev ? { ...prev, poll: { ...prev.poll, status } } : prev,
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, user]);

  async function handleSubmit() {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/polls/${pollId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId: selectedOption }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to submit response");
      }
      setJustSubmitted(selectedOption);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit response",
      );
      // Refresh state in case the failure was due to seats filling up concurrently
      load();
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || stillFetchingPollData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="font-medium">You must be logged in to respond.</p>
            <Button asChild className="w-full">
              <Link
                href={`/auth/login?callbackUrl=/elective-polls/respond/${pollId}`}
              >
                Log In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Poll not found.</p>
      </div>
    );
  }

  const { poll, eligible, ineligibleReason, myResponse, canRespond, viaReopenGrant } =
    data;
  const respondedOptionId = justSubmitted ?? myResponse?.optionId ?? null;

  if (respondedOptionId) {
    const chosen = poll.options.find((o) => o.id === respondedOptionId);
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-8 pb-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold">Response recorded</h2>
            <p className="text-muted-foreground text-sm">
              You&apos;ve been allocated
              {chosen ? ` "${chosen.label}"` : " your choice"} for {poll.title}.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canRespond) {
    const isDraft = poll.status === "draft";
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5 pt-8 pb-8 text-center">
            <div>
              <h2 className="text-xl font-semibold">{poll.title}</h2>
              {poll.description && (
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {poll.description}
                </p>
              )}
            </div>
            <div className="space-y-2 border-t pt-5">
              {isDraft ? (
                <Clock className="mx-auto h-9 w-9 text-amber-500" />
              ) : (
                <Lock className="text-muted-foreground mx-auto h-9 w-9" />
              )}
              <h3 className="font-medium">
                {isDraft ? "Not open yet" : "No longer accepting responses"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isDraft
                  ? "The organizer hasn't started accepting responses for this poll yet. Please check back a little later."
                  : "The organizer has closed this poll. If you think this is a mistake, reach out to them directly."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-8 pb-8 text-center">
            <h2 className="text-xl font-semibold">
              Not eligible for this Poll
            </h2>
            <p className="text-muted-foreground text-sm">
              {ineligibleReason === "NOT_IN_ROSTER"
                ? "You're not part of the roster for this poll's audience."
                : "This poll isn't targeted at your batch/section."}
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-22 flex min-h-screen flex-col items-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{poll.title}</CardTitle>
          {poll.description && (
            <p className="text-muted-foreground text-sm">{poll.description}</p>
          )}
          {viaReopenGrant && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-950/30 dark:text-green-400">
              You&apos;ve been granted access to respond to this poll even
              though it&apos;s closed for others.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {poll.options
              .filter((o) => o.status === "active")
              .map((option) => {
                const disabled = option.isFull || submitting;
                const selected = selectedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full space-y-2 rounded-lg border p-4 text-left transition-colors ${
                      selected
                        ? "border-green-500 bg-green-50 ring-2 ring-green-500/30 dark:bg-green-950/30"
                        : "border-border"
                    } ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-primary/50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected
                              ? "border-green-500 bg-green-500"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {selected && (
                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                          )}
                        </span>
                        {option.label}
                      </span>
                      <CapacityBadge
                        seatsTaken={option.seatsTaken}
                        capacity={option.capacity}
                      />
                    </div>
                    {option.description && (
                      <p className="text-muted-foreground text-xs">
                        {option.description}
                      </p>
                    )}
                    <SeatBar
                      seatsTaken={option.seatsTaken}
                      capacity={option.capacity}
                    />
                  </button>
                );
              })}
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedOption || submitting}
            onClick={() => setConfirmOpen(true)}
          >
            Submit
          </Button>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm your selection"
        description={
          selectedOption
            ? `You're about to submit "${poll.options.find((o) => o.id === selectedOption)?.label}" for ${poll.title}. This can't be changed once submitted.`
            : ""
        }
        confirmLabel="Confirm & Submit"
        loading={submitting}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
