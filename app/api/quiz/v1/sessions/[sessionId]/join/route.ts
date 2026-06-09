import { NextRequest, NextResponse } from "next/server";

import { joinQuizSession } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const {
    joinCode,
    displayName,
    avatar,
    participantToken,
  } = body as {
    joinCode?: string;
    displayName?: string;
    avatar?: string;
    participantToken?: string;
  };

  try {
    const result = await joinQuizSession(sessionId, {
      joinCode,
      displayName,
      avatar,
      participantToken,
    });
    const status = "reconnected" in result && result.reconnected ? 200 : 201;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to join session. Please try again." } },
      { status: 500 },
    );
  }
}
