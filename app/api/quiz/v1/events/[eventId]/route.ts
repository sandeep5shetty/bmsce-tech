import { NextRequest, NextResponse } from "next/server";

import {
  deleteQuizEvent,
  getQuizEvent,
  updateQuizEvent,
} from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { updateEventSchema } from "@/features/quiz/lib/validation";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  try {
    const event = await getQuizEvent(eventId);
    return NextResponse.json({ event });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch event." } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const parsed = updateEventSchema.safeParse(body);
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
    const event = await updateQuizEvent(eventId, parsed.data);
    return NextResponse.json({ event });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Failed to update event. Please try again." } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  try {
    await deleteQuizEvent(eventId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: "Failed to delete event. Please try again." } },
      { status: 500 },
    );
  }
}
