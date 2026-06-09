import { NextRequest, NextResponse } from "next/server";

import {
  deleteQuizQuestion,
  getQuizQuestion,
  updateQuizQuestion,
} from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { createQuestionSchema } from "@/features/quiz/lib/validation";

type RouteContext = {
  params: Promise<{ eventId: string; questionId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { eventId, questionId } = await params;
  try {
    const question = await getQuizQuestion(eventId, questionId);
    return NextResponse.json({ question });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch question." } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { eventId, questionId } = await params;
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
    const result = await updateQuizQuestion(eventId, questionId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Failed to update question." } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { eventId, questionId } = await params;
  try {
    await deleteQuizQuestion(eventId, questionId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: "Failed to delete question." } },
      { status: 500 },
    );
  }
}
