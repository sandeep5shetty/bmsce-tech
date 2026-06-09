import { NextRequest, NextResponse } from "next/server";

import { createQuizSession } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { createSessionSchema } from "@/features/quiz/lib/validation";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "eventId is required.",
          field: "eventId",
        },
      },
      { status: 400 },
    );
  }

  try {
    const { session, created } = await createQuizSession(parsed.data);
    return NextResponse.json({ session }, { status: created ? 201 : 200 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create session. Please try again." } },
      { status: 500 },
    );
  }
}
