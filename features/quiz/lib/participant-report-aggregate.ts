import type { QuizQuestionType } from "./types";

export const SCORABLE_QUESTION_TYPES = new Set<QuizQuestionType>([
  "single_select",
  "multi_select",
  "image_choice",
]);

export type QuestionOutcome = "correct" | "incorrect" | "skipped" | "unscored";

export interface ReportQuestionReviewItem {
  questionId: string;
  position: number;
  text: string;
  questionType: QuizQuestionType;
  outcome: QuestionOutcome;
  scoreAwarded: number;
  responseTimeMs: number | null;
  cohortAvgResponseTimeMs: number | null;
  yourAnswerLabel: string | null;
  correctAnswerLabel: string | null;
}

export interface ReportTypePerformance {
  questionType: QuizQuestionType;
  answered: number;
  correct: number;
  accuracyPercent: number | null;
}

export interface ParticipantDeterministicReport {
  sessionId: string;
  participantId: string;
  displayName: string;
  avatar: string;
  eventTitle: string;
  totalScore: number;
  rank: number | null;
  participantCount: number;
  percentile: number;
  scoredQuestionCount: number;
  answeredScoredCount: number;
  correctScoredCount: number;
  accuracyPercent: number | null;
  skippedScoredCount: number;
  unscoredQuestionCount: number;
  answeredUnscoredCount: number;
  avgResponseTimeMs: number | null;
  cohortAvgResponseTimeMs: number | null;
  responseTimeVsCohort: "faster" | "slower" | "similar" | "unknown";
  typePerformance: ReportTypePerformance[];
  strengths: string[];
  improvements: string[];
  questionReview: ReportQuestionReviewItem[];
}

type ReportAnswerOption = {
  id: string;
  position: number;
  text: string | null;
  isCorrect: boolean;
};

type ReportQuestion = {
  id: string;
  position: number;
  text: string;
  questionType: QuizQuestionType;
  answerOptions: ReportAnswerOption[];
};

type ReportAnswer = {
  questionId: string;
  selectedOptionIds: string[] | null;
  openTextResponse: string | null;
  ratingValue: number | null;
  isCorrect: boolean | null;
  scoreAwarded: number;
  responseTimeMs: number | null;
};

export function isScoredQuestionType(
  questionType: string,
): questionType is QuizQuestionType {
  return SCORABLE_QUESTION_TYPES.has(questionType as QuizQuestionType);
}

export function computePercentile(
  participantScore: number,
  allScores: number[],
): number {
  if (allScores.length === 0) return 0;
  if (allScores.length === 1) return 100;
  const below = allScores.filter((s) => s < participantScore).length;
  return Math.round((below / allScores.length) * 100);
}

function formatOptionLabels(
  optionIds: string[],
  options: ReportAnswerOption[],
): string {
  const byId = new Map(options.map((o) => [o.id, o]));
  return optionIds
    .map(
      (id) =>
        byId.get(id)?.text?.trim() ||
        `Option ${byId.get(id)?.position ?? "?"}`,
    )
    .join(", ");
}

function correctOptionLabel(options: ReportAnswerOption[]): string | null {
  const correct = options.filter((o) => o.isCorrect);
  if (correct.length === 0) return null;
  return correct
    .map((o) => o.text?.trim() || `Option ${o.position}`)
    .join(", ");
}

function classifyOutcome(
  question: ReportQuestion,
  answer: ReportAnswer | undefined,
): QuestionOutcome {
  if (!isScoredQuestionType(question.questionType)) {
    return "unscored";
  }
  if (!answer || !answer.selectedOptionIds?.length) {
    return "skipped";
  }
  if (answer.isCorrect) return "correct";
  return "incorrect";
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function compareResponseTime(
  participantAvg: number | null,
  cohortAvg: number | null,
): ParticipantDeterministicReport["responseTimeVsCohort"] {
  if (participantAvg == null || cohortAvg == null || cohortAvg === 0) {
    return "unknown";
  }
  const ratio = participantAvg / cohortAvg;
  if (ratio <= 0.85) return "faster";
  if (ratio >= 1.15) return "slower";
  return "similar";
}

function buildStrengthsAndImprovements(input: {
  accuracyPercent: number | null;
  typePerformance: ReportTypePerformance[];
  responseTimeVsCohort: ParticipantDeterministicReport["responseTimeVsCohort"];
  skippedScoredCount: number;
  scoredQuestionCount: number;
}): { strengths: string[]; improvements: string[] } {
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (input.accuracyPercent != null) {
    if (input.accuracyPercent >= 80) {
      strengths.push(
        `Strong overall accuracy at ${input.accuracyPercent}% on scored questions.`,
      );
    } else if (input.accuracyPercent < 60) {
      improvements.push(
        `Overall accuracy was ${input.accuracyPercent}% — review missed questions below.`,
      );
    }
  }

  for (const row of input.typePerformance) {
    if (row.accuracyPercent == null || row.answered === 0) continue;
    const label = row.questionType.replace(/_/g, " ");
    if (row.accuracyPercent >= 85 && row.answered >= 2) {
      strengths.push(
        `Solid ${label} performance (${row.accuracyPercent}% correct).`,
      );
    }
    if (row.accuracyPercent < 50 && row.answered >= 2) {
      improvements.push(
        `Focus on ${label} questions (${row.accuracyPercent}% correct).`,
      );
    }
  }

  if (input.responseTimeVsCohort === "faster") {
    strengths.push("You answered faster than the session average.");
  } else if (input.responseTimeVsCohort === "slower") {
    improvements.push(
      "You took longer than average — balance careful reading with time limits.",
    );
  }

  if (input.scoredQuestionCount > 0 && input.skippedScoredCount > 0) {
    improvements.push(
      `You skipped ${input.skippedScoredCount} scored question${input.skippedScoredCount === 1 ? "" : "s"} — submit an answer even when unsure.`,
    );
  }

  if (
    strengths.length === 0 &&
    input.accuracyPercent != null &&
    input.accuracyPercent >= 60
  ) {
    strengths.push("You stayed engaged throughout the quiz.");
  }
  if (
    improvements.length === 0 &&
    input.accuracyPercent != null &&
    input.accuracyPercent < 100
  ) {
    improvements.push("Review the question breakdown for targeted practice.");
  }

  return {
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5),
  };
}

export function buildDeterministicParticipantReport(input: {
  sessionId: string;
  participantId: string;
  displayName: string;
  avatar: string;
  eventTitle: string;
  totalScore: number;
  rank: number | null;
  participantCount: number;
  allParticipantScores: number[];
  questions: ReportQuestion[];
  answersByQuestionId: Map<string, ReportAnswer>;
  cohortAvgResponseTimeByQuestion: Map<string, number | null>;
}): ParticipantDeterministicReport {
  const questions = [...input.questions].sort((a, b) => a.position - b.position);

  const questionReview: ReportQuestionReviewItem[] = questions.map((q) => {
    const answer = input.answersByQuestionId.get(q.id);
    const outcome = classifyOutcome(q, answer);
    const selectedIds = answer?.selectedOptionIds ?? [];
    let yourAnswerLabel: string | null = null;

    if (isScoredQuestionType(q.questionType)) {
      yourAnswerLabel =
        selectedIds.length > 0
          ? formatOptionLabels(selectedIds, q.answerOptions)
          : null;
    } else if (answer?.openTextResponse?.trim()) {
      yourAnswerLabel = answer.openTextResponse.trim();
    } else if (answer?.ratingValue != null) {
      yourAnswerLabel = `Rating: ${answer.ratingValue}`;
    }

    return {
      questionId: q.id,
      position: q.position,
      text: q.text,
      questionType: q.questionType,
      outcome,
      scoreAwarded: answer?.scoreAwarded ?? 0,
      responseTimeMs: answer?.responseTimeMs ?? null,
      cohortAvgResponseTimeMs:
        input.cohortAvgResponseTimeByQuestion.get(q.id) ?? null,
      yourAnswerLabel,
      correctAnswerLabel: isScoredQuestionType(q.questionType)
        ? correctOptionLabel(q.answerOptions)
        : null,
    };
  });

  const scoredQuestions = questions.filter((q) =>
    isScoredQuestionType(q.questionType),
  );
  const unscoredQuestions = questions.filter(
    (q) => !isScoredQuestionType(q.questionType),
  );

  let answeredScoredCount = 0;
  let correctScoredCount = 0;
  let skippedScoredCount = 0;

  for (const q of scoredQuestions) {
    const answer = input.answersByQuestionId.get(q.id);
    const outcome = classifyOutcome(q, answer);
    if (outcome === "skipped") {
      skippedScoredCount += 1;
      continue;
    }
    answeredScoredCount += 1;
    if (outcome === "correct") correctScoredCount += 1;
  }

  const accuracyPercent =
    answeredScoredCount > 0
      ? Math.round((correctScoredCount / answeredScoredCount) * 100)
      : null;

  const typePerformance: ReportTypePerformance[] = [];
  const types = new Set(scoredQuestions.map((q) => q.questionType));
  for (const questionType of types) {
    const ofType = scoredQuestions.filter(
      (q) => q.questionType === questionType,
    );
    let answered = 0;
    let correct = 0;
    for (const q of ofType) {
      const answer = input.answersByQuestionId.get(q.id);
      const outcome = classifyOutcome(q, answer);
      if (outcome === "skipped") continue;
      answered += 1;
      if (outcome === "correct") correct += 1;
    }
    typePerformance.push({
      questionType,
      answered,
      correct,
      accuracyPercent:
        answered > 0 ? Math.round((correct / answered) * 100) : null,
    });
  }

  const participantTimes = questionReview
    .map((q) => q.responseTimeMs)
    .filter((t): t is number => t != null);
  const cohortTimes = questionReview
    .map((q) => q.cohortAvgResponseTimeMs)
    .filter((t): t is number => t != null);

  const avgResponseTimeMs = average(participantTimes);
  const cohortAvgResponseTimeMs = average(cohortTimes);
  const responseTimeVsCohort = compareResponseTime(
    avgResponseTimeMs,
    cohortAvgResponseTimeMs,
  );

  let answeredUnscoredCount = 0;
  for (const q of unscoredQuestions) {
    const answer = input.answersByQuestionId.get(q.id);
    if (
      answer?.openTextResponse?.trim() ||
      answer?.ratingValue != null ||
      (answer?.selectedOptionIds?.length ?? 0) > 0
    ) {
      answeredUnscoredCount += 1;
    }
  }

  const { strengths, improvements } = buildStrengthsAndImprovements({
    accuracyPercent,
    typePerformance,
    responseTimeVsCohort,
    skippedScoredCount,
    scoredQuestionCount: scoredQuestions.length,
  });

  return {
    sessionId: input.sessionId,
    participantId: input.participantId,
    displayName: input.displayName,
    avatar: input.avatar,
    eventTitle: input.eventTitle,
    totalScore: input.totalScore,
    rank: input.rank,
    participantCount: input.participantCount,
    percentile: computePercentile(input.totalScore, input.allParticipantScores),
    scoredQuestionCount: scoredQuestions.length,
    answeredScoredCount,
    correctScoredCount,
    accuracyPercent,
    skippedScoredCount,
    unscoredQuestionCount: unscoredQuestions.length,
    answeredUnscoredCount,
    avgResponseTimeMs,
    cohortAvgResponseTimeMs,
    responseTimeVsCohort,
    typePerformance,
    strengths,
    improvements,
    questionReview,
  };
}
