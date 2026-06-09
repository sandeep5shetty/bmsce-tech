import { NextRequest, NextResponse } from "next/server";

import {
  createQuizEvent,
  listQuizEvents,
} from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { createEventSchema } from "@/features/quiz/lib/validation";

export async function GET() {
  try {
    const events = await listQuizEvents();
    return NextResponse.json({ events });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch events. Please try again." } },
      { status: 500 },
    );
  }
}

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

  const parsed = createEventSchema.safeParse(body);
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
    const event = await createQuizEvent(parsed.data);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message: "Failed to create event. Please try again." } },
      { status: 500 },
    );
  }
}
