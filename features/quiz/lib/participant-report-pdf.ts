import { createElement, type ReactElement } from "react";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";

import { ParticipantReportPdfDocument } from "@/features/quiz/pdf/participant-report-document";

import type { ParticipantDeterministicReport } from "./participant-report-aggregate";
import type { ParticipantReportAiFeedback } from "./validation";

export { computeParticipantReportPdfContentHash } from "./participant-report-pdf-hash";

export async function renderParticipantReportPdfBuffer(input: {
  report: ParticipantDeterministicReport;
  aiFeedback: ParticipantReportAiFeedback | null;
}): Promise<Buffer> {
  const aiForPdf =
    input.aiFeedback && input.aiFeedback.summary.trim().length > 0
      ? input.aiFeedback
      : null;

  const element = createElement(ParticipantReportPdfDocument, {
    report: input.report,
    aiFeedback: aiForPdf,
  }) as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);

  return Buffer.from(buffer);
}
