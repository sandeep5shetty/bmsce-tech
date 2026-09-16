/**
 * Run: npx tsx scripts/test-participant-report-pdf-logic.ts
 */
import { buildDeterministicParticipantReport } from "../features/quiz/lib/participant-report-aggregate";
import { computeParticipantReportPdfContentHash } from "../features/quiz/lib/participant-report-pdf-hash";
import {
  buildQuizParticipantReportKey,
  isQuizParticipantReportKey,
} from "../lib/s3/storage";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const sessionId = "3a2612da-3883-4a66-a6e4-9e49fc0ca167";
const participantId = "931c9e93-a59d-492f-97bc-23fae70ab375";

const key = buildQuizParticipantReportKey(sessionId, participantId);
assert(isQuizParticipantReportKey(key), "valid report key");
assert(
  !isQuizParticipantReportKey("profiles/quiz/uploads/evil.pdf"),
  "reject non-report keys",
);

const baseReport = buildDeterministicParticipantReport({
  sessionId,
  participantId,
  displayName: "Alex",
  avatar: "🎯",
  eventTitle: "Demo",
  totalScore: 500,
  rank: 1,
  participantCount: 2,
  allParticipantScores: [500, 100],
  questions: [
    {
      id: "q1",
      position: 1,
      text: "2+2?",
      questionType: "single_select",
      answerOptions: [
        { id: "a", position: 1, text: "4", isCorrect: true },
      ],
    },
  ],
  answersByQuestionId: new Map([
    [
      "q1",
      {
        questionId: "q1",
        selectedOptionIds: ["a"],
        openTextResponse: null,
        ratingValue: null,
        isCorrect: true,
        scoreAwarded: 500,
        responseTimeMs: 1000,
      },
    ],
  ]),
  cohortAvgResponseTimeByQuestion: new Map([["q1", 2000]]),
});

const hashWithoutAi = computeParticipantReportPdfContentHash({
  sessionId,
  participantId,
  report: baseReport,
  aiFeedback: null,
});

const hashWithAi = computeParticipantReportPdfContentHash({
  sessionId,
  participantId,
  report: baseReport,
  aiFeedback: {
    summary: "Great job.",
    strengths: ["Speed"],
    improvement_areas: ["Accuracy"],
    prioritized_actions: ["Review Q1"],
  },
});

assert(hashWithoutAi !== hashWithAi, "hash changes when AI feedback added");
assert(
  computeParticipantReportPdfContentHash({
    sessionId,
    participantId,
    report: baseReport,
    aiFeedback: null,
  }) === hashWithoutAi,
  "hash is stable",
);

async function main() {
  if (process.env.SMOKE_PDF === "1") {
    const { renderParticipantReportPdfBuffer } = await import(
      "../features/quiz/lib/participant-report-pdf"
    );
    const buf = await renderParticipantReportPdfBuffer({
      report: baseReport,
      aiFeedback: null,
    });
    assert(buf.subarray(0, 4).toString() === "%PDF", "valid PDF header");
  }
  console.log("participant-report PDF logic checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
