import { NextRequest, NextResponse } from "next/server";

import { advanceQuizSession } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { advanceSessionSchema } from "@/features/quiz/lib/validation";

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

  const parsed = advanceSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: 'Action must be "start" or "advance".',
          field: "action",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await advanceQuizSession(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to advance session state." } },
      { status: 500 },
    );
  }
}
