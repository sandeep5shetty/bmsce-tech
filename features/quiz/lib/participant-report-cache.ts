import { and, eq, inArray, lt, or } from "drizzle-orm";

import db from "@/db";
import { quizParticipantReport } from "@/db/schema";

import { isMissingReportTableError } from "./participant-report-cache-shared";
import type { ParticipantReportAiFeedback } from "./validation";

export type ParticipantReportAiStatus =
  | "idle"
  | "generating"
  | "ready"
  | "failed"
  | "unavailable";

const STALE_GENERATING_MS = 3 * 60 * 1000;

export interface CachedReportAiState {
  status: ParticipantReportAiStatus;
  feedback: ParticipantReportAiFeedback | null;
  error: string | null;
}

function parseFeedback(raw: unknown): ParticipantReportAiFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as ParticipantReportAiFeedback;
}

export async function getCachedReportAiState(
  participantId: string,
): Promise<CachedReportAiState> {
  let row;
  try {
    row = await db.query.quizParticipantReport.findFirst({
      where: eq(quizParticipantReport.participantId, participantId),
    });
  } catch (error) {
    if (isMissingReportTableError(error)) {
      return { status: "idle", feedback: null, error: null };
    }
    throw error;
  }

  if (!row) {
    return { status: "idle", feedback: null, error: null };
  }

  return {
    status: row.aiStatus as ParticipantReportAiStatus,
    feedback: parseFeedback(row.aiFeedback),
    error: row.aiError,
  };
}

export type ClaimGenerationResult =
  | { action: "generate" }
  | { action: "wait" }
  | { action: "ready"; feedback: ParticipantReportAiFeedback | null }
  | { action: "unavailable" };

export async function claimParticipantReportGeneration(
  sessionId: string,
  participantId: string,
): Promise<ClaimGenerationResult> {
  let existing;
  try {
    existing = await db.query.quizParticipantReport.findFirst({
      where: eq(quizParticipantReport.participantId, participantId),
    });
  } catch (error) {
    if (isMissingReportTableError(error)) {
      return { action: "generate" };
    }
    throw error;
  }

  if (existing?.aiStatus === "ready") {
    return {
      action: "ready",
      feedback: parseFeedback(existing.aiFeedback),
    };
  }

  if (existing?.aiStatus === "unavailable") {
    return { action: "unavailable" };
  }

  if (existing?.aiStatus === "generating") {
    const age = Date.now() - existing.updatedAt.getTime();
    if (age < STALE_GENERATING_MS) {
      return { action: "wait" };
    }
  }

  const staleBefore = new Date(Date.now() - STALE_GENERATING_MS);

  if (existing) {
    try {
      const updated = await db
        .update(quizParticipantReport)
        .set({
          aiStatus: "generating",
          aiError: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quizParticipantReport.participantId, participantId),
            or(
              inArray(quizParticipantReport.aiStatus, ["idle", "failed"]),
              and(
                eq(quizParticipantReport.aiStatus, "generating"),
                lt(quizParticipantReport.updatedAt, staleBefore),
              ),
            ),
          ),
        )
        .returning({ id: quizParticipantReport.id });

      if (updated.length > 0) {
        return { action: "generate" };
      }
      return { action: "wait" };
    } catch (error) {
      if (isMissingReportTableError(error)) {
        return { action: "generate" };
      }
      throw error;
    }
  }

  try {
    await db.insert(quizParticipantReport).values({
      sessionId,
      participantId,
      aiStatus: "generating",
    });
    return { action: "generate" };
  } catch (error) {
    if (isMissingReportTableError(error)) {
      return { action: "generate" };
    }
    if (!isUniqueViolation(error)) throw error;
    return { action: "wait" };
  }
}

async function ignoreMissingReportTable(error: unknown): Promise<void> {
  if (!isMissingReportTableError(error)) throw error;
}

export async function saveParticipantReportAiSuccess(
  participantId: string,
  feedback: ParticipantReportAiFeedback,
): Promise<void> {
  try {
    await db
      .update(quizParticipantReport)
      .set({
        aiStatus: "ready",
        aiFeedback: feedback,
        aiError: null,
        updatedAt: new Date(),
      })
      .where(eq(quizParticipantReport.participantId, participantId));
  } catch (error) {
    await ignoreMissingReportTable(error);
  }
}

export async function saveParticipantReportAiFailure(
  participantId: string,
  message: string,
): Promise<void> {
  try {
    await db
      .update(quizParticipantReport)
      .set({
        aiStatus: "failed",
        aiError: message.slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(quizParticipantReport.participantId, participantId));
  } catch (error) {
    await ignoreMissingReportTable(error);
  }
}

export async function markParticipantReportAiUnavailable(
  sessionId: string,
  participantId: string,
): Promise<void> {
  try {
    await db
      .insert(quizParticipantReport)
      .values({
        sessionId,
        participantId,
        aiStatus: "unavailable",
        aiError: "AI feedback is not configured.",
      })
      .onConflictDoUpdate({
        target: quizParticipantReport.participantId,
        set: {
          aiStatus: "unavailable",
          aiError: "AI feedback is not configured.",
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    await ignoreMissingReportTable(error);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}
