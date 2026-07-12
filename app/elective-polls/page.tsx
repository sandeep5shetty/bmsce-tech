"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Loader2, Plus, Users } from "lucide-react";
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

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Elective Polls</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create seat-limited elective polls and track live allocation.
          </p>
        </div>
        {!loading && !forbidden && (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/elective-polls/students">
                <Users className="mr-1.5 h-4 w-4" />
                Manage Students
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/elective-polls/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Poll
              </Link>
            </Button>
          </div>
        )}
      </div>

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
  );
}
