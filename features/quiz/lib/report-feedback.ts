import { and, desc, eq } from "drizzle-orm";

import db from "@/db";
import { quizSession, quizSessionReportFeedback } from "@/db/schema";

import { QuizApiError } from "./auth";
import { resolveParticipantByToken } from "./participant-report";
import {
  submitReportFeedbackSchema,
  type SubmitReportFeedbackInput,
} from "./validation";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

function isMissingFeedbackTable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code =
    "code" in error ? String((error as { code: unknown }).code) : undefined;
  if (code === "42P01") return true;
  const cause = "cause" in error ? (error as { cause: unknown }).cause : null;
  if (typeof cause === "object" && cause !== null && "code" in cause) {
    return String((cause as { code: unknown }).code) === "42P01";
  }
  return false;
}

export async function getParticipantReportFeedback(
  sessionId: string,
  participantId: string,
) {
  let row;
  try {
    row = await db.query.quizSessionReportFeedback.findFirst({
      where: and(
        eq(quizSessionReportFeedback.sessionId, sessionId),
        eq(quizSessionReportFeedback.participantId, participantId),
      ),
    });
  } catch (error) {
    if (isMissingFeedbackTable(error)) {
      return { submitted: false as const };
    }
    throw error;
  }

  if (!row) {
    return { submitted: false as const };
  }

  return {
    submitted: true as const,
    rating: row.rating,
    feedback_text: row.feedbackText,
    is_anonymous: row.isAnonymous,
    display_name: row.isAnonymous ? null : row.displayName,
    submitted_at: row.createdAt.toISOString(),
  };
}

export async function submitParticipantReportFeedback(
  sessionId: string,
  participantToken: string,
  raw: SubmitReportFeedbackInput,
) {
  const parsed = submitReportFeedbackSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new QuizApiError(
      "VALIDATION_ERROR",
      issue?.message ?? "Invalid feedback.",
      400,
    );
  }

  const participant = await resolveParticipantByToken(
    sessionId,
    participantToken,
  );

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: { status: true },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.status !== "ended") {
    throw new QuizApiError(
      "SESSION_NOT_ENDED",
      "Feedback is available after the quiz ends.",
      409,
    );
  }

  const data = parsed.data;
  let displayName = "Anonymous";

  if (!data.is_anonymous) {
    displayName = data.display_name!.trim();
  }

  try {
    await db.insert(quizSessionReportFeedback).values({
      sessionId,
      participantId: participant.id,
      displayName,
      isAnonymous: data.is_anonymous,
      rating: data.rating,
      feedbackText: data.feedback_text,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new QuizApiError(
        "ALREADY_SUBMITTED",
        "You have already submitted feedback for this session.",
        409,
      );
    }
    if (isMissingFeedbackTable(error)) {
      throw new QuizApiError(
        "SERVICE_UNAVAILABLE",
        "Feedback is not available yet. Please try again later or contact the organizer.",
        503,
      );
    }
    throw error;
  }

  return getParticipantReportFeedback(sessionId, participant.id);
}

export async function listSessionReportFeedbackForAdmin(sessionId: string) {
  let rows;
  try {
    rows = await db.query.quizSessionReportFeedback.findMany({
    where: eq(quizSessionReportFeedback.sessionId, sessionId),
    orderBy: desc(quizSessionReportFeedback.createdAt),
    columns: {
      id: true,
      displayName: true,
      isAnonymous: true,
      rating: true,
      feedbackText: true,
      createdAt: true,
      participantId: true,
    },
    });
  } catch (error) {
    if (isMissingFeedbackTable(error)) return [];
    throw error;
  }

  return rows.map((row) => ({
    id: row.id,
    display_name: row.isAnonymous ? "Anonymous" : row.displayName,
    is_anonymous: row.isAnonymous,
    rating: row.rating,
    feedback_text: row.feedbackText,
    submitted_at: row.createdAt.toISOString(),
    participant_id: row.isAnonymous ? null : row.participantId,
  }));
}
