import { createHash } from "crypto";

import type { ParticipantDeterministicReport } from "./participant-report-aggregate";
import type { ParticipantReportAiFeedback } from "./validation";

const MAX_QUESTIONS_IN_HASH = 64;

export function computeParticipantReportPdfContentHash(input: {
  sessionId: string;
  participantId: string;
  report: ParticipantDeterministicReport;
  aiFeedback: ParticipantReportAiFeedback | null;
}): string {
  const reviewFingerprint = input.report.questionReview
    .slice(0, MAX_QUESTIONS_IN_HASH)
    .map(
      (q) =>
        `${q.questionId}:${q.outcome}:${q.scoreAwarded}:${q.yourAnswerLabel ?? ""}`,
    )
    .join("|");

  const aiPart = input.aiFeedback
    ? JSON.stringify({
        summary: input.aiFeedback.summary,
        strengths: input.aiFeedback.strengths,
        improvement_areas: input.aiFeedback.improvement_areas,
        prioritized_actions: input.aiFeedback.prioritized_actions,
      })
    : "";

  const payload = [
    input.sessionId,
    input.participantId,
    input.report.totalScore,
    input.report.rank,
    input.report.accuracyPercent,
    input.report.correctScoredCount,
    input.report.answeredScoredCount,
    reviewFingerprint,
    aiPart,
  ].join("\n");

  return createHash("sha256").update(payload).digest("hex");
}
