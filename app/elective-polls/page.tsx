"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    fetch("/api/elective-polls/v1/polls")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          setForbidden(true);
          return;
        }
        const body = await res.json();
        setPolls(body.polls ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Elective Polls</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create seat-limited elective polls and track live allocation.
          </p>
        </div>
        {!forbidden && (
          <Button asChild size="sm">
            <Link href="/elective-polls/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Poll
            </Link>
          </Button>
        )}
      </div>

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
