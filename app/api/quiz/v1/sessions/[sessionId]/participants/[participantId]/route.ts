import { NextRequest, NextResponse } from "next/server";

import { removeQuizParticipantByAdmin } from "@/features/quiz/lib/actions";
import { isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";

type RouteContext = {
  params: Promise<{ sessionId: string; participantId: string }>;
};

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { sessionId, participantId } = await params;
  try {
    const result = await removeQuizParticipantByAdmin(sessionId, participantId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "Failed to remove participant.",
        },
      },
      { status: 500 },
    );
  }
}
