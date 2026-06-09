import { NextRequest, NextResponse } from "next/server";

import { getQuizSessionLive } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  try {
    const result = await getQuizSessionLive(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch live session state." } },
      { status: 500 },
    );
  }
}
