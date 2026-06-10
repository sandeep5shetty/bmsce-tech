import { NextRequest, NextResponse } from "next/server";

import { bulkCreateQuizQuestions } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { bulkCreateQuestionsSchema } from "@/features/quiz/lib/validation";

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

  const parsed = bulkCreateQuestionsSchema.safeParse(body);
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
    const result = await bulkCreateQuizQuestions(
      eventId,
      parsed.data.questions,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      {
        error: {
          code: "CREATE_FAILED",
          message: "Failed to add questions.",
        },
      },
      { status: 500 },
    );
  }
}
