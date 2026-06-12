import { NextRequest, NextResponse } from "next/server";

import { removeQuizParticipant } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;

  const authHeader = request.headers.get("authorization");
  const participantToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

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
    const result = await removeQuizParticipant(sessionId, participantToken);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to leave session." } },
      { status: 500 },
    );
  }
}
