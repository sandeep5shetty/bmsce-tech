/**
 * Pure-logic checks for participant report aggregation (no DB).
 * Run: npx tsx scripts/test-participant-report-logic.ts
 */
import {
  buildDeterministicParticipantReport,
  computePercentile,
  isScoredQuestionType,
} from "../features/quiz/lib/participant-report-aggregate";
import { participantReportAiFeedbackSchema } from "../features/quiz/lib/validation";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(computePercentile(100, [50, 80, 100, 100]) === 50, "percentile mid rank");
assert(computePercentile(50, [50]) === 100, "solo participant percentile");
assert(isScoredQuestionType("open_text") === false, "open text unscored");

const report = buildDeterministicParticipantReport({
  sessionId: "s1",
  participantId: "p1",
  displayName: "Alex",
  avatar: "🎯",
  eventTitle: "Demo Quiz",
  totalScore: 800,
  rank: 2,
  participantCount: 4,
  allParticipantScores: [1200, 800, 800, 400],
  questions: [
    {
      id: "q1",
      position: 1,
      text: "2+2?",
      questionType: "single_select",
      answerOptions: [
        { id: "a", position: 1, text: "3", isCorrect: false },
        { id: "b", position: 2, text: "4", isCorrect: true },
      ],
    },
    {
      id: "q2",
      position: 2,
      text: "Feedback",
      questionType: "open_text",
      answerOptions: [],
    },
    {
      id: "q3",
      position: 3,
      text: "Skipped?",
      questionType: "single_select",
      answerOptions: [
        { id: "c", position: 1, text: "Yes", isCorrect: true },
      ],
    },
  ],
  answersByQuestionId: new Map([
    [
      "q1",
      {
        questionId: "q1",
        selectedOptionIds: ["b"],
        openTextResponse: null,
        ratingValue: null,
        isCorrect: true,
        scoreAwarded: 500,
        responseTimeMs: 2000,
      },
    ],
    [
      "q2",
      {
        questionId: "q2",
        selectedOptionIds: null,
        openTextResponse: "Nice quiz",
        ratingValue: null,
        isCorrect: null,
        scoreAwarded: 0,
        responseTimeMs: 1000,
      },
    ],
  ]),
  cohortAvgResponseTimeByQuestion: new Map([
    ["q1", 3000],
    ["q3", 4000],
  ]),
});

assert(report.correctScoredCount === 1, "one correct scored");
assert(report.skippedScoredCount === 1, "one skipped scored");
assert(report.answeredUnscoredCount === 1, "open text answered");
assert(report.accuracyPercent === 100, "accuracy on answered scored only");
assert(
  report.questionReview.find((q) => q.questionId === "q2")?.outcome === "unscored",
  "open text unscored outcome",
);
assert(
  report.questionReview.find((q) => q.questionId === "q3")?.outcome === "skipped",
  "missing answer is skipped",
);
assert(report.percentile === 25, "percentile counts strictly lower scores only");

const aiParse = participantReportAiFeedbackSchema.safeParse({
  summary: "Nice work.",
  strengths: ["Speed"],
  improvement_areas: ["Accuracy"],
  prioritized_actions: ["Review misses"],
});
assert(aiParse.success, "AI feedback schema accepts valid payload");

console.log("participant-report logic checks passed");
