import { and, eq, inArray, lt, or } from "drizzle-orm";

import db from "@/db";
import { quizParticipantReport } from "@/db/schema";

import { isMissingReportTableError } from "./participant-report-cache-shared";

export type ParticipantReportPdfStatus =
  | "idle"
  | "generating"
  | "ready"
  | "failed"
  | "unavailable";

const STALE_GENERATING_MS = 3 * 60 * 1000;

export interface CachedReportPdfState {
  status: ParticipantReportPdfStatus;
  s3Key: string | null;
  contentHash: string | null;
  error: string | null;
}

export async function getCachedReportPdfState(
  participantId: string,
): Promise<CachedReportPdfState> {
  try {
    const row = await db.query.quizParticipantReport.findFirst({
      where: eq(quizParticipantReport.participantId, participantId),
      columns: {
        pdfStatus: true,
        pdfS3Key: true,
        pdfContentHash: true,
        pdfError: true,
      },
    });

    if (!row) {
      return { status: "idle", s3Key: null, contentHash: null, error: null };
    }

    return {
      status: row.pdfStatus as ParticipantReportPdfStatus,
      s3Key: row.pdfS3Key,
      contentHash: row.pdfContentHash,
      error: row.pdfError,
    };
  } catch (error) {
    if (isMissingReportTableError(error)) {
      return { status: "idle", s3Key: null, contentHash: null, error: null };
    }
    throw error;
  }
}

export type ClaimPdfGenerationResult =
  | { action: "generate" }
  | { action: "wait" }
  | { action: "ready"; s3Key: string; contentHash: string }
  | { action: "unavailable" };

export async function claimParticipantReportPdfGeneration(
  sessionId: string,
  participantId: string,
  desiredContentHash: string,
): Promise<ClaimPdfGenerationResult> {
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

  if (
    existing?.pdfStatus === "ready" &&
    existing.pdfS3Key &&
    existing.pdfContentHash === desiredContentHash
  ) {
    return {
      action: "ready",
      s3Key: existing.pdfS3Key,
      contentHash: existing.pdfContentHash,
    };
  }

  if (existing?.pdfStatus === "unavailable") {
    return { action: "unavailable" };
  }

  if (existing?.pdfStatus === "generating") {
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
          pdfStatus: "generating",
          pdfError: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quizParticipantReport.participantId, participantId),
            or(
              inArray(quizParticipantReport.pdfStatus, [
                "idle",
                "failed",
                "ready",
              ]),
              and(
                eq(quizParticipantReport.pdfStatus, "generating"),
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
      pdfStatus: "generating",
    });
    return { action: "generate" };
  } catch (error) {
    if (isMissingReportTableError(error)) {
      return { action: "generate" };
    }
    if (isUniqueViolation(error)) {
      return { action: "wait" };
    }
    throw error;
  }
}

export async function saveParticipantReportPdfSuccess(
  participantId: string,
  input: { s3Key: string; contentHash: string },
): Promise<void> {
  try {
    await db
      .update(quizParticipantReport)
      .set({
        pdfStatus: "ready",
        pdfS3Key: input.s3Key,
        pdfContentHash: input.contentHash,
        pdfError: null,
        pdfGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quizParticipantReport.participantId, participantId));
  } catch (error) {
    if (!isMissingReportTableError(error)) throw error;
  }
}

export async function saveParticipantReportPdfFailure(
  participantId: string,
  message: string,
): Promise<void> {
  try {
    await db
      .update(quizParticipantReport)
      .set({
        pdfStatus: "failed",
        pdfError: message.slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(quizParticipantReport.participantId, participantId));
  } catch (error) {
    if (!isMissingReportTableError(error)) throw error;
  }
}

export async function markParticipantReportPdfUnavailable(
  sessionId: string,
  participantId: string,
  message: string,
): Promise<void> {
  try {
    await db
      .insert(quizParticipantReport)
      .values({
        sessionId,
        participantId,
        pdfStatus: "unavailable",
        pdfError: message.slice(0, 500),
      })
      .onConflictDoUpdate({
        target: quizParticipantReport.participantId,
        set: {
          pdfStatus: "unavailable",
          pdfError: message.slice(0, 500),
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    if (!isMissingReportTableError(error)) throw error;
  }
}

export async function getParticipantReportPdfKeyForDownload(
  sessionId: string,
  participantId: string,
): Promise<string | null> {
  const row = await db.query.quizParticipantReport.findFirst({
    where: and(
      eq(quizParticipantReport.participantId, participantId),
      eq(quizParticipantReport.sessionId, sessionId),
    ),
    columns: { pdfStatus: true, pdfS3Key: true },
  });

  if (row?.pdfStatus !== "ready" || !row.pdfS3Key) return null;
  return row.pdfS3Key;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}
