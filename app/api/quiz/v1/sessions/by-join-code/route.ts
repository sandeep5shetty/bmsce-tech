import { NextRequest, NextResponse } from "next/server";

import { findQuizSessionByJoinCode } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code || code.trim() === "") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Query parameter 'code' is required.",
          field: "code",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await findQuizSessionByJoinCode(code);
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to look up session." } },
      { status: 500 },
    );
  }
}
