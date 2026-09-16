import { eq } from "drizzle-orm";

import db from "@/db";
import { quizParticipantReport } from "@/db/schema";
import {
  deleteS3ObjectByKey,
  isQuizParticipantReportKey,
  isS3Configured,
} from "@/lib/s3/storage";

export async function deleteQuizReportPdfsForSession(
  sessionId: string,
): Promise<void> {
  if (!isS3Configured()) return;

  const rows = await db.query.quizParticipantReport.findMany({
    where: eq(quizParticipantReport.sessionId, sessionId),
    columns: { pdfS3Key: true },
  });

  for (const row of rows) {
    const key = row.pdfS3Key;
    if (!key || !isQuizParticipantReportKey(key)) continue;
    try {
      await deleteS3ObjectByKey(key);
    } catch {
      // Best-effort cleanup; DB cascade still removes metadata.
    }
  }
}
