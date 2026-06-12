import { NextRequest, NextResponse } from "next/server";

import { listQuizEventSessions } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;

  try {
    const sessions = await listQuizEventSessions(eventId);
    return NextResponse.json({ sessions });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch sessions.",
        },
      },
      { status: 500 },
    );
  }
}
