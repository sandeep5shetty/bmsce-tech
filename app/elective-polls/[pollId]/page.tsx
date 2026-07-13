"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  ListPlus,
  Loader2,
  Pencil,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AddStudentsDialog } from "@/features/elective-polls/components/add-students-dialog";
import {
  CapacityBadge,
  SeatBar,
} from "@/features/elective-polls/components/capacity-badge";
import { CollaboratorsDialog } from "@/features/elective-polls/components/collaborators-dialog";
import { PollStatusControl } from "@/features/elective-polls/components/poll-status-control";

import { getUser } from "@/actions/user";

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
  student: { id: string; name: string; usn: string; section: string | null };
}

interface PollDetail {
  id: string;
  creatorId: string;
  creatorName: string | null;
  creatorEmail: string | null;
  title: string;
  description: string | null;
  status: "draft" | "open" | "closed";
  options: PollOption[];
  audienceMode: "all" | "group" | "custom";
  audienceRule: { batch: string; section: string | null } | null;
  audienceMembers: AudienceMember[];
  audienceExclusions: AudienceMember[];
}

export default function ElectivePollDetailPage() {
  const params = useParams();
  const pollId = typeof params.pollId === "string" ? params.pollId : "";

  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
  });

  const respondLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/elective-polls/respond/${pollId}`
      : "";

  function load() {
    fetch(`/api/elective-polls/v1/polls/${pollId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error?.message ?? "Failed to load poll");
          return;
        }
        setPoll(body.poll);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);

  function copyLink() {
    navigator.clipboard.writeText(respondLink);
    toast.success("Link copied");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="container mx-auto mt-8 max-w-3xl px-6 text-center">
        <p className="text-muted-foreground">{error ?? "Poll not found."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-3xl space-y-6 px-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/elective-polls">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{poll.title}</h1>
          {poll.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {poll.description}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/elective-polls/${poll.id}/edit`}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PollStatusControl
          pollId={poll.id}
          status={poll.status}
          onChanged={(updated) =>
            setPoll((p) => (p ? { ...p, status: updated.status } : p))
          }
        />
        <Button size="sm" variant="outline" onClick={copyLink}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy response link
        </Button>
        {/* <Button size="sm" variant="outline" asChild>
          <Link href={`/elective-polls/respond/${poll.id}`} target="_blank">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open response page
          </Link>
        </Button> */}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/elective-polls/${poll.id}/responses`}>
            View responses
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCollaboratorsOpen(true)}
        >
          <Users className="mr-1.5 h-3.5 w-3.5" />
          Collaborators
        </Button>
        {poll.status !== "draft" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddStudentsOpen(true)}
          >
            <ListPlus className="mr-1.5 h-3.5 w-3.5" />
            Add Students
          </Button>
        )}
      </div>

      <CollaboratorsDialog
        open={collaboratorsOpen}
        onOpenChange={setCollaboratorsOpen}
        pollId={poll.id}
        isCreator={!!currentUser && poll.creatorId === currentUser.id}
        currentUserEmail={currentUser?.email ?? null}
        creatorName={poll.creatorName}
        creatorEmail={poll.creatorEmail}
      />
      <AddStudentsDialog
        open={addStudentsOpen}
        onOpenChange={setAddStudentsOpen}
        pollId={poll.id}
        onSuccess={load}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {option.label}
                  {option.status === "archived" && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Archived
                    </Badge>
                  )}
                </span>
                <CapacityBadge
                  seatsTaken={option.seatsTaken}
                  capacity={option.capacity}
                />
              </div>
              <SeatBar
                seatsTaken={option.seatsTaken}
                capacity={option.capacity}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Audience</CardTitle>
        </CardHeader>
        <CardContent>
          {poll.audienceMode === "all" && (
            <p className="text-muted-foreground text-sm">
              All logged-in students.
            </p>
          )}
          {poll.audienceMode === "group" && poll.audienceRule && (
            <div className="space-y-2">
              <Badge variant="outline">
                Batch {poll.audienceRule.batch}
                {poll.audienceRule.section
                  ? `, Sec ${poll.audienceRule.section}`
                  : ""}
              </Badge>
              {poll.audienceExclusions.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs">
                    Excluding {poll.audienceExclusions.length} student
                    {poll.audienceExclusions.length === 1 ? "" : "s"}:
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {poll.audienceExclusions.map((m) => (
                      <Badge key={m.id} variant="outline" className="text-xs">
                        {m.student.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {poll.audienceMode === "custom" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {poll.audienceMembers.length} student
                {poll.audienceMembers.length === 1 ? "" : "s"} (custom list)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {poll.audienceMembers.map((m) => (
                  <Badge key={m.id} variant="outline" className="text-xs">
                    {m.student.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
