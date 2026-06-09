import { NextRequest, NextResponse } from "next/server";

import { endQuizSession, getQuizSession } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  try {
    const session = await getQuizSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch session." } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  try {
    await endQuizSession(sessionId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to end session." } },
      { status: 500 },
    );
  }
}
