import { NextRequest, NextResponse } from "next/server";

import {
  deleteQuizAnalyticsSession,
  getQuizAnalytics,
} from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  try {
    const result = await getQuizAnalytics(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch analytics." } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  try {
    await deleteQuizAnalyticsSession(sessionId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: "Failed to delete session." } },
      { status: 500 },
    );
  }
}
