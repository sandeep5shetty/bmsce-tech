import { NextRequest, NextResponse } from "next/server";

import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { resolveParticipantByToken } from "@/features/quiz/lib/participant-report";
import { generateParticipantReportPdf } from "@/features/quiz/lib/participant-report-pdf-api";
import { getParticipantReportPdfKeyForDownload } from "@/features/quiz/lib/participant-report-pdf-cache";
import {
  getS3ObjectBuffer,
  isQuizParticipantReportKey,
} from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ sessionId: string }> };

function extractParticipantToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}

function safePdfFilename(displayHint: string): string {
  const base = displayHint.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
  return `${base || "quiz_report"}.pdf`;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const participantToken = extractParticipantToken(request);

  if (!participantToken) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authorization header with participant token is required.",
        },
      },
      { status: 401 },
    );
  }

  try {
    const participant = await resolveParticipantByToken(
      sessionId,
      participantToken,
    );

    const key = await getParticipantReportPdfKeyForDownload(
      sessionId,
      participant.id,
    );

    if (!key || !isQuizParticipantReportKey(key)) {
      return NextResponse.json(
        {
          error: {
            code: "PDF_NOT_READY",
            message: "Your PDF is not ready yet. Generate it from the report page.",
          },
        },
        { status: 404 },
      );
    }

    const { body, contentType } = await getS3ObjectBuffer(key);
    const nameParam = request.nextUrl.searchParams.get("name");
    const filename = safePdfFilename(nameParam ?? "quiz_report");

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("pdf")
          ? contentType
          : "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to download PDF." } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const participantToken = extractParticipantToken(request);

  if (!participantToken) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authorization header with participant token is required.",
        },
      },
      { status: 401 },
    );
  }

  try {
    const participant = await resolveParticipantByToken(
      sessionId,
      participantToken,
    );
    const result = await generateParticipantReportPdf(
      sessionId,
      participant.id,
    );
    const status =
      "generating" in result && result.generating ? 202 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "Failed to generate PDF.",
        },
      },
      { status: 500 },
    );
  }
}
