import { NextRequest, NextResponse } from "next/server";

import { publishQuizEvent } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import { publishEventSchema } from "@/features/quiz/lib/validation";

type RouteContext = { params: Promise<{ eventId: string }> };

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

  const parsed = publishEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: 'Action must be "publish" or "unpublish".',
          field: "action",
        },
      },
      { status: 400 },
    );
  }

  try {
    const event = await publishQuizEvent(eventId, parsed.data);
    return NextResponse.json({ event });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to publish event." } },
      { status: 500 },
    );
  }
}
