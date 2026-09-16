"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { ParticipantReportView } from "@/features/quiz/components/participant-report";
import {
  getQuizParticipantTokenForSession,
} from "@/features/quiz/lib/participant-storage";

export default function ParticipantReportPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const participantToken = getQuizParticipantTokenForSession(sessionId);

  useEffect(() => {
    if (!participantToken) {
      router.replace(`/quiz/play/${sessionId}`);
    }
  }, [participantToken, router, sessionId]);

  if (!participantToken) {
    return null;
  }

  return (
    <ParticipantReportView
      sessionId={sessionId}
      participantToken={participantToken}
    />
  );
}
