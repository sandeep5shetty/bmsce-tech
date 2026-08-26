"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Loader2, Plus, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EmptyAddCard } from "@/components/common/empty-add-card";

import { ElectivePollCard } from "@/features/elective-polls/components/elective-poll-card";

interface PollListItem {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  options: { seatsTaken: number; capacity: number }[];
  audienceMode: "all" | "group" | "custom";
  audienceRule: { batch: string; section: string | null } | null;
  audienceMembers: unknown[];
  audienceExclusions: unknown[];
  role: "owner" | "collaborator";
}

interface PendingInvite {
  id: string;
  pollId: string;
  pollTitle: string;
  invitedByName: string | null;
}

function audienceLabel(poll: PollListItem): string {
  if (poll.audienceMode === "group" && poll.audienceRule) {
    const base = `Batch ${poll.audienceRule.batch}${poll.audienceRule.section ? `, Sec ${poll.audienceRule.section}` : ""}`;
    return poll.audienceExclusions.length > 0
      ? `${base} (excl. ${poll.audienceExclusions.length})`
      : base;
  }
  if (poll.audienceMode === "custom") {
    return `${poll.audienceMembers.length} student${poll.audienceMembers.length === 1 ? "" : "s"} (custom)`;
  }
  return "All students";
}

export default function ElectivePollsPage() {
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  function loadInvites() {
    fetch("/api/elective-polls/v1/collaborator-invites")
      .then((res) => (res.ok ? res.json() : { invites: [] }))
      .then((body) => setInvites(body.invites ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/elective-polls/v1/polls")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          setForbidden(true);
          return;
        }
        const body = await res.json();
        setPolls(body.polls ?? []);
        loadInvites();
      })
      .finally(() => setLoading(false));
  }, []);

  async function respondToInvite(
    invite: PendingInvite,
    response: "accepted" | "declined",
  ) {
    setRespondingId(invite.id);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/collaborator-invites/${invite.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to respond");
      }
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      if (response === "accepted") {
        toast.success(`You're now a collaborator on "${invite.pollTitle}"`);
        const res2 = await fetch("/api/elective-polls/v1/polls");
        if (res2.ok) {
          const body2 = await res2.json();
          setPolls(body2.polls ?? []);
        }
      } else {
        toast.success("Invitation declined");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to respond");
    } finally {
      setRespondingId(null);
    }
  }

  const stats = useMemo(() => {
    const totalSeats = polls.reduce(
      (sum, p) => sum + p.options.reduce((s, o) => s + o.capacity, 0),
      0,
    );
    const totalTaken = polls.reduce(
      (sum, p) => sum + p.options.reduce((s, o) => s + o.seatsTaken, 0),
      0,
    );
    return {
      pollCount: polls.length,
      openCount: polls.filter((p) => p.status === "open").length,
      totalTaken,
      totalSeats,
    };
  }, [polls]);

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="from-primary/25 pointer-events-none absolute -top-32 -right-16 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-linear-to-br from-emerald-500/20 to-transparent blur-3xl" />

        <div className="relative container mx-auto max-w-6xl px-6 pt-16 pb-10">
          <span className="text-primary bg-primary/10 mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Seat-Limited Registration
          </span>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif max-w-2xl text-5xl leading-[1.02] font-normal">
                Elective Polls
              </h1>
              <p className="text-muted-foreground mt-4 max-w-xl text-lg">
                Create seat-limited elective polls and track live seat
                allocation — the moment a section fills up, it locks
                automatically.
              </p>
            </div>
            {!loading && !forbidden && (
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild size="lg" variant="outline">
                  <Link href="/elective-polls/students">
                    <Users className="mr-1.5 h-4 w-4" />
                    Manage Students
                  </Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/elective-polls/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    New Poll
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!loading && !forbidden && (
        <div className="container mx-auto mb-10 grid max-w-6xl grid-cols-2 gap-3 px-6 sm:grid-cols-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {stats.pollCount}
            </div>
            <div className="text-muted-foreground text-xs">Polls created</div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {stats.openCount}
            </div>
            <div className="text-muted-foreground text-xs">Open right now</div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {stats.totalTaken} / {stats.totalSeats}
            </div>
            <div className="text-muted-foreground text-xs">Seats filled</div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {stats.totalSeats > 0
                ? `${Math.round((stats.totalTaken / stats.totalSeats) * 100)}%`
                : "—"}
            </div>
            <div className="text-muted-foreground text-xs">Avg fill rate</div>
          </div>
        </div>
      )}

      <div className="container mx-auto mb-32 max-w-6xl space-y-6 px-6">

      {!loading && !forbidden && invites.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invites
              <span className="text-muted-foreground font-normal">
                {" "}
                ({invites.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {invite.pollTitle}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    Invited by {invite.invitedByName ?? "a fellow admin"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respondingId === invite.id}
                    onClick={() => respondToInvite(invite, "declined")}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={respondingId === invite.id}
                    onClick={() => respondToInvite(invite, "accepted")}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : forbidden ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          You don&apos;t have access to manage elective polls. Ask an existing
          elective-poll admin to grant you access.
        </div>
      ) : polls.length === 0 ? (
        <EmptyAddCard
          title="Create Elective Poll"
          description="Create your first seat-limited poll and share the response link."
          href="/elective-polls/new"
        />
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <ElectivePollCard
              key={poll.id}
              id={poll.id}
              title={poll.title}
              status={poll.status}
              options={poll.options}
              audienceLabel={audienceLabel(poll)}
              hasResponses={poll.options.some((o) => o.seatsTaken > 0)}
              role={poll.role}
              onDeleted={(id) =>
                setPolls((prev) => prev.filter((p) => p.id !== id))
              }
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
