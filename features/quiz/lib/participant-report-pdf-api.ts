import {
  buildQuizParticipantReportKey,
  isQuizParticipantReportKey,
  isS3Configured,
  uploadPrivateDocumentBuffer,
} from "@/lib/s3/storage";

import { getCachedReportAiState } from "./participant-report-cache";
import {
  claimParticipantReportPdfGeneration,
  getCachedReportPdfState,
  markParticipantReportPdfUnavailable,
  saveParticipantReportPdfFailure,
  saveParticipantReportPdfSuccess,
} from "./participant-report-pdf-cache";
import { computeParticipantReportPdfContentHash } from "./participant-report-pdf-hash";
import { renderParticipantReportPdfBuffer } from "./participant-report-pdf";
import { loadDeterministicParticipantReport } from "./participant-report";

export function serializePdfState(state: Awaited<
  ReturnType<typeof getCachedReportPdfState>
>) {
  return {
    status: state.status,
    content_hash: state.contentHash,
    error: state.error,
    download_path: state.status === "ready" ? "pdf" : null,
  };
}

export async function buildParticipantReportPdfStatus(
  sessionId: string,
  participantId: string,
) {
  const pdf = await getCachedReportPdfState(participantId);
  return serializePdfState(pdf);
}

export async function generateParticipantReportPdf(
  sessionId: string,
  participantId: string,
) {
  const report = await loadDeterministicParticipantReport(
    sessionId,
    participantId,
  );

  if (!isS3Configured()) {
    await markParticipantReportPdfUnavailable(
      sessionId,
      participantId,
      "PDF storage is not configured.",
    );
    return {
      pdf: await buildParticipantReportPdfStatus(sessionId, participantId),
    };
  }

  const ai = await getCachedReportAiState(participantId);
  const aiFeedback =
    ai.status === "ready" ? ai.feedback : null;

  const contentHash = computeParticipantReportPdfContentHash({
    sessionId,
    participantId,
    report,
    aiFeedback,
  });

  const claim = await claimParticipantReportPdfGeneration(
    sessionId,
    participantId,
    contentHash,
  );

  if (claim.action === "ready") {
    return {
      pdf: {
        status: "ready" as const,
        content_hash: claim.contentHash,
        error: null,
        download_path: "pdf" as const,
      },
    };
  }

  if (claim.action === "unavailable") {
    return {
      pdf: await buildParticipantReportPdfStatus(sessionId, participantId),
    };
  }

  if (claim.action === "wait") {
    return {
      pdf: {
        ...(await buildParticipantReportPdfStatus(sessionId, participantId)),
      },
      generating: true as const,
    };
  }

  try {
    const pdfBuffer = await renderParticipantReportPdfBuffer({
      report,
      aiFeedback,
    });

    const s3Key = buildQuizParticipantReportKey(sessionId, participantId);
    if (!isQuizParticipantReportKey(s3Key)) {
      throw new Error("Invalid report storage key.");
    }

    await uploadPrivateDocumentBuffer({
      key: s3Key,
      body: pdfBuffer,
      contentType: "application/pdf",
    });

    await saveParticipantReportPdfSuccess(participantId, {
      s3Key,
      contentHash,
    });

    return {
      pdf: {
        status: "ready" as const,
        content_hash: contentHash,
        error: null,
        download_path: "pdf" as const,
      },
    };
  } catch {
    await saveParticipantReportPdfFailure(
      participantId,
      "Could not generate your PDF. Please try again.",
    );
    return {
      pdf: await buildParticipantReportPdfStatus(sessionId, participantId),
    };
  }
}
