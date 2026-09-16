import { NextRequest, NextResponse } from "next/server";

import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { resolveParticipantByToken } from "@/features/quiz/lib/participant-report";
import {
  getParticipantReportFeedback,
  submitParticipantReportFeedback,
} from "@/features/quiz/lib/report-feedback";

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
    const feedback = await getParticipantReportFeedback(
      sessionId,
      participant.id,
    );
    return NextResponse.json({ feedback });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to load feedback." } },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  try {
    const feedback = await submitParticipantReportFeedback(
      sessionId,
      participantToken,
      body as Parameters<typeof submitParticipantReportFeedback>[2],
    );
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to submit feedback." } },
      { status: 500 },
    );
  }
}
