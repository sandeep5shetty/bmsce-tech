import { NextRequest, NextResponse } from "next/server";

import { bulkUpdateQuestionTimeLimits } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { bulkUpdateTimeLimitsSchema } from "@/features/quiz/lib/validation";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsed = bulkUpdateTimeLimitsSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: issue?.message ?? "Validation failed.",
          field: issue?.path.join("."),
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await bulkUpdateQuestionTimeLimits(
      eventId,
      parsed.data.time_limit,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    console.error("bulkUpdateQuestionTimeLimits failed:", error);
    return NextResponse.json(
      {
        error: {
          code: "UPDATE_FAILED",
          message: "Failed to update question timings.",
        },
      },
      { status: 500 },
    );
  }
}
