import { NextRequest, NextResponse } from "next/server";

import { updateQuizParticipantAvatar } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const { avatar } = body as { avatar?: string };

  try {
    const result = await updateQuizParticipantAvatar(
      sessionId,
      participantToken,
      avatar ?? "",
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update avatar." } },
      { status: 500 },
    );
  }
}
