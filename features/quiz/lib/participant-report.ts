import { and, asc, desc, eq } from "drizzle-orm";

import db from "@/db";
import {
  quizAnalyticsSnapshot,
  quizParticipantAnswer,
  quizSession,
  quizSessionParticipant,
} from "@/db/schema";

import { QuizApiError } from "./auth";
import {
  buildDeterministicParticipantReport,
  type ParticipantDeterministicReport,
} from "./participant-report-aggregate";
import type { QuizQuestionType } from "./types";

export {
  buildDeterministicParticipantReport,
  computePercentile,
  isScoredQuestionType,
  SCORABLE_QUESTION_TYPES,
  type ParticipantDeterministicReport,
  type QuestionOutcome,
  type ReportQuestionReviewItem,
  type ReportTypePerformance,
} from "./participant-report-aggregate";

type ReportAnswer = {
  questionId: string;
  selectedOptionIds: string[] | null;
  openTextResponse: string | null;
  ratingValue: number | null;
  isCorrect: boolean | null;
  scoreAwarded: number;
  responseTimeMs: number | null;
};

type ReportQuestion = {
  id: string;
  position: number;
  text: string;
  questionType: QuizQuestionType;
  answerOptions: Array<{
    id: string;
    position: number;
    text: string | null;
    isCorrect: boolean;
  }>;
};

export async function loadDeterministicParticipantReport(
  sessionId: string,
  participantId: string,
): Promise<ParticipantDeterministicReport> {
  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    with: {
      event: {
        with: {
          questions: {
            with: { answerOptions: true },
          },
        },
      },
    },
  });

  if (!session?.event) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.status !== "ended") {
    throw new QuizApiError(
      "SESSION_NOT_ENDED",
      "Your report is available after the quiz ends.",
      409,
    );
  }

  const participant = await db.query.quizSessionParticipant.findFirst({
    where: and(
      eq(quizSessionParticipant.id, participantId),
      eq(quizSessionParticipant.sessionId, sessionId),
    ),
  });

  if (!participant) {
    throw new QuizApiError("UNAUTHORIZED", "Participant not found.", 401);
  }

  const allParticipants = await db.query.quizSessionParticipant.findMany({
    where: eq(quizSessionParticipant.sessionId, sessionId),
    columns: { totalScore: true },
    orderBy: [
      desc(quizSessionParticipant.totalScore),
      asc(quizSessionParticipant.displayName),
    ],
  });

  const answers = await db.query.quizParticipantAnswer.findMany({
    where: and(
      eq(quizParticipantAnswer.sessionId, sessionId),
      eq(quizParticipantAnswer.participantId, participantId),
    ),
  });

  const snapshots = await db.query.quizAnalyticsSnapshot.findMany({
    where: eq(quizAnalyticsSnapshot.sessionId, sessionId),
    columns: { questionId: true, avgResponseTimeMs: true },
  });

  const cohortAvgResponseTimeByQuestion = new Map(
    snapshots.map((s) => [s.questionId, s.avgResponseTimeMs]),
  );

  const answersByQuestionId = new Map<string, ReportAnswer>();
  for (const a of answers) {
    answersByQuestionId.set(a.questionId, {
      questionId: a.questionId,
      selectedOptionIds: a.selectedOptionIds,
      openTextResponse: a.openTextResponse,
      ratingValue: a.ratingValue,
      isCorrect: a.isCorrect,
      scoreAwarded: a.scoreAwarded,
      responseTimeMs: a.responseTimeMs,
    });
  }

  const questions: ReportQuestion[] = session.event.questions.map((q) => ({
    id: q.id,
    position: q.position,
    text: q.text,
    questionType: q.questionType as QuizQuestionType,
    answerOptions: q.answerOptions.map((o) => ({
      id: o.id,
      position: o.position,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
  }));

  return buildDeterministicParticipantReport({
    sessionId,
    participantId,
    displayName: participant.displayName,
    avatar: participant.avatar,
    eventTitle: session.event.title,
    totalScore: participant.totalScore,
    rank: participant.rank,
    participantCount: allParticipants.length,
    allParticipantScores: allParticipants.map((p) => p.totalScore),
    questions,
    answersByQuestionId,
    cohortAvgResponseTimeByQuestion,
  });
}

export async function resolveParticipantByToken(
  sessionId: string,
  participantToken: string,
) {
  const participant = await db.query.quizSessionParticipant.findFirst({
    where: and(
      eq(quizSessionParticipant.participantToken, participantToken),
      eq(quizSessionParticipant.sessionId, sessionId),
    ),
    columns: { id: true },
  });

  if (!participant) {
    throw new QuizApiError("UNAUTHORIZED", "Invalid participant token.", 401);
  }

  return participant;
}
