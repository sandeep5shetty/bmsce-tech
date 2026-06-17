import { NextRequest, NextResponse } from "next/server";

import { updateQuizParticipantProfile } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { updateParticipantProfileSchema } from "@/features/quiz/lib/validation";

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

  const parsed = updateParticipantProfileSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: issue?.message ?? "Validation failed.",
          field: issue?.path[0]?.toString(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await updateQuizParticipantProfile(
      sessionId,
      participantToken,
      parsed.data,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update profile." } },
      { status: 500 },
    );
  }
}
