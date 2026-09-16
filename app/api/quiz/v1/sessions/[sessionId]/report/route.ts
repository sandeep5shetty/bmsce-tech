import { NextRequest, NextResponse } from "next/server";

import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import {
  buildParticipantReportPayload,
  generateParticipantReportAi,
} from "@/features/quiz/lib/participant-report-api";
import { resolveParticipantByToken } from "@/features/quiz/lib/participant-report";

type RouteContext = { params: Promise<{ sessionId: string }> };

function extractParticipantToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
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
    const payload = await buildParticipantReportPayload(
      sessionId,
      participant.id,
    );
    return NextResponse.json(payload);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to load report." } },
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
    const payload = await generateParticipantReportAi(
      sessionId,
      participant.id,
    );
    const status =
      "generating" in payload && payload.generating ? 202 : 200;
    return NextResponse.json(payload, { status });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "Failed to generate report feedback.",
        },
      },
      { status: 500 },
    );
  }
}
