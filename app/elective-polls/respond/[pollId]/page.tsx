"use client";

import { useParams } from "next/navigation";

import { StudentResponseForm } from "@/features/elective-polls/components/student-response-form";

export default function RespondToElectivePollPage() {
  const params = useParams();
  const pollId = typeof params.pollId === "string" ? params.pollId : "";

  return <StudentResponseForm pollId={pollId} />;
}
