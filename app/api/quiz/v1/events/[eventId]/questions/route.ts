import { NextRequest, NextResponse } from "next/server";

import {
  createQuizQuestion,
  listQuizQuestions,
} from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { createQuestionSchema } from "@/features/quiz/lib/validation";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  try {
    const questions = await listQuizQuestions(eventId);
    return NextResponse.json({ questions });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch questions." } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const parsed = createQuestionSchema.safeParse(body);
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
    const result = await createQuizQuestion(eventId, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message: "Failed to create question." } },
      { status: 500 },
    );
  }
}
