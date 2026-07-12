"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { getUser } from "@/actions/user";

interface InviteDetails {
  id: string;
  pollId: string;
  pollTitle: string;
  status: "pending" | "accepted" | "declined";
  invitedByName: string | null;
}

export function AcceptCollaboratorInvite({ inviteId }: { inviteId: string }) {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
  });

  const [data, setData] = useState<InviteDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notYours, setNotYours] = useState(false);
  const [responding, setResponding] = useState(false);
  const [justResponded, setJustResponded] = useState<
    "accepted" | "declined" | null
  >(null);

  const stillFetching = !!user && !data && !notFound && !notYours;

  async function load() {
    try {
      const res = await fetch(
        `/api/elective-polls/v1/collaborator-invites/${inviteId}`,
      );
      if (res.status === 403) {
        setNotYours(true);
        return;
      }
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const body = await res.json();
      setData(body.invite);
    } catch {
      setNotFound(true);
    }
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId, user]);

  async function respond(response: "accepted" | "declined") {
    setResponding(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/collaborator-invites/${inviteId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to respond");
      }
      setJustResponded(response);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to respond",
      );
    } finally {
      setResponding(false);
    }
  }

  if (userLoading || stillFetching) {
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
                href={`/auth/login?callbackUrl=/elective-polls/collaborators/accept/${inviteId}`}
              >
                Log In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notYours) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-8 pb-8 text-center">
            <h2 className="text-xl font-semibold">Not your invitation</h2>
            <p className="text-muted-foreground text-sm">
              This invitation isn&apos;t addressed to your account. If you
              believe this is a mistake, ask the person who invited you to
              re-send it to the right email address.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Invitation not found.</p>
      </div>
    );
  }

  const finalStatus = justResponded ?? (data.status !== "pending" ? data.status : null);

  if (finalStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-8 pb-8 text-center">
            {finalStatus === "accepted" ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h2 className="text-xl font-semibold">
                  You&apos;re a collaborator!
                </h2>
                <p className="text-muted-foreground text-sm">
                  You now have access to manage &quot;{data.pollTitle}
                  &quot;.
                </p>
                <Button asChild>
                  <Link href={`/elective-polls/${data.pollId}`}>
                    Open Poll
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <XCircle className="text-muted-foreground mx-auto h-12 w-12" />
                <h2 className="text-xl font-semibold">Invitation declined</h2>
                <p className="text-muted-foreground text-sm">
                  You won&apos;t be given access to &quot;{data.pollTitle}
                  &quot;.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 pt-8 pb-8 text-center">
          <h2 className="text-xl font-semibold">{data.pollTitle}</h2>
          <p className="text-muted-foreground text-sm">
            {data.invitedByName ?? "A fellow admin"} has invited you to
            collaborate on this elective poll. Once accepted, you&apos;ll be
            able to manage its options, audience, and responses.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={responding}
              onClick={() => respond("declined")}
            >
              Decline
            </Button>
            <Button
              className="flex-1"
              disabled={responding}
              onClick={() => respond("accepted")}
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
