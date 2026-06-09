import { NextRequest, NextResponse } from "next/server";

import { exportQuizAnalyticsCsv } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  try {
    const csv = await exportQuizAnalyticsCsv(sessionId);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="session-${sessionId}-results.csv"`,
      },
    });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to export analytics." } },
      { status: 500 },
    );
  }
}
