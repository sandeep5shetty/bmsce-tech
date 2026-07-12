"use client";

import { useParams } from "next/navigation";

import { AcceptCollaboratorInvite } from "@/features/elective-polls/components/accept-collaborator-invite";

export default function AcceptCollaboratorInvitePage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";

  return <AcceptCollaboratorInvite inviteId={token} />;
}
