import { asc, desc, eq } from "drizzle-orm";

import db from "@/db";
import {
  quizAnalyticsSnapshot,
  quizParticipantAnswer,
  quizQuestion,
  quizSession,
  quizSessionParticipant,
} from "@/db/schema";

import type { OptionCountEntry } from "./types";

/**
 * Generates analytics snapshots for all questions in a session.
 * Called when a session transitions to 'ended' state.
 */
export async function generateAnalyticsSnapshots(
  sessionId: string,
): Promise<void> {
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

  if (!session?.event) return;

  const questions = [...session.event.questions].sort(
    (a, b) => a.position - b.position,
  );
  if (questions.length === 0) return;

  const answers = await db.query.quizParticipantAnswer.findMany({
    where: eq(quizParticipantAnswer.sessionId, sessionId),
    columns: {
      questionId: true,
      selectedOptionIds: true,
      responseTimeMs: true,
    },
  });

  const answersByQuestion = new Map<
    string,
    Array<{ selectedOptionIds: string[] | null; responseTimeMs: number | null }>
  >();

  for (const answer of answers) {
    if (!answersByQuestion.has(answer.questionId)) {
      answersByQuestion.set(answer.questionId, []);
    }
    answersByQuestion.get(answer.questionId)!.push({
      selectedOptionIds: answer.selectedOptionIds,
      responseTimeMs: answer.responseTimeMs,
    });
  }

  for (const question of questions) {
    const qAnswers = answersByQuestion.get(question.id) ?? [];
    const totalResponses = qAnswers.length;

    const optionCounts: OptionCountEntry[] = [];
    if (
      question.questionType === "single_select" ||
      question.questionType === "multi_select" ||
      question.questionType === "image_choice"
    ) {
      const countMap = new Map<string, number>();
      for (const opt of question.answerOptions) {
        countMap.set(opt.id, 0);
      }
      for (const answer of qAnswers) {
        for (const optId of answer.selectedOptionIds ?? []) {
          countMap.set(optId, (countMap.get(optId) ?? 0) + 1);
        }
      }
      for (const [optionId, optionCount] of countMap.entries()) {
        const percentage =
          totalResponses > 0
            ? Math.round((optionCount / totalResponses) * 100)
            : 0;
        optionCounts.push({ optionId, count: optionCount, percentage });
      }
    }

    const responseTimes = qAnswers
      .map((a) => a.responseTimeMs)
      .filter((t): t is number => t !== null && t !== undefined);
    const avgResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
          )
        : null;

    await db
      .insert(quizAnalyticsSnapshot)
      .values({
        sessionId,
        questionId: question.id,
        totalResponses,
        optionCounts,
        avgResponseTimeMs,
      })
      .onConflictDoUpdate({
        target: [
          quizAnalyticsSnapshot.sessionId,
          quizAnalyticsSnapshot.questionId,
        ],
        set: {
          totalResponses,
          optionCounts,
          avgResponseTimeMs,
        },
      });
  }
}

/**
 * Generates a CSV export for a session.
 */
export async function generateSessionCsv(sessionId: string): Promise<string> {
  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    with: {
      event: {
        with: {
          questions: {
            orderBy: asc(quizQuestion.position),
          },
        },
      },
    },
  });

  const questions = session?.event?.questions ?? [];

  const participants = await db.query.quizSessionParticipant.findMany({
    where: eq(quizSessionParticipant.sessionId, sessionId),
    orderBy: [
      desc(quizSessionParticipant.totalScore),
      asc(quizSessionParticipant.displayName),
    ],
  });

  const answers = await db.query.quizParticipantAnswer.findMany({
    where: eq(quizParticipantAnswer.sessionId, sessionId),
    columns: {
      participantId: true,
      questionId: true,
      scoreAwarded: true,
    },
  });

  const answerMap = new Map<string, Map<string, number>>();
  for (const answer of answers) {
    if (!answerMap.has(answer.participantId)) {
      answerMap.set(answer.participantId, new Map());
    }
    answerMap.get(answer.participantId)!.set(answer.questionId, answer.scoreAwarded);
  }

  const escapeCsv = (val: string | number | null | undefined): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "Participant",
    ...questions.map((q) =>
      escapeCsv(`Q${q.position}: ${q.text.slice(0, 30)}`),
    ),
    "Total Score",
  ];

  const rows = participants.map((p) => {
    const pAnswers = answerMap.get(p.id) ?? new Map();
    const scores = questions.map((q) => {
      const score = pAnswers.get(q.id);
      return score !== undefined ? String(score) : "";
    });
    return [escapeCsv(p.displayName), ...scores, String(p.totalScore)];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
