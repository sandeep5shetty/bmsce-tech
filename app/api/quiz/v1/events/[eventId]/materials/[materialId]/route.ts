import { NextRequest, NextResponse } from "next/server";

import { isQuizApiError, quizErrorBody, requireAdmin } from "@/features/quiz/lib/auth";
import {
  deleteQuizEventMaterial,
  retryQuizMaterialIndexing,
} from "@/features/quiz/lib/quiz-materials";
import { getOwnedEvent } from "@/features/quiz/lib/quiz-materials-access";

type RouteContext = {
  params: Promise<{ eventId: string; materialId: string }>;
};

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { eventId, materialId } = await params;

  try {
    const admin = await requireAdmin();
    const event = await getOwnedEvent(admin.id, eventId);
    if (!event) {
      return NextResponse.json(
        { error: { code: "EVENT_NOT_FOUND", message: "Event not found." } },
        { status: 404 },
      );
    }

    const result = await deleteQuizEventMaterial(eventId, materialId);
    return NextResponse.json(result);
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete material." } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId, materialId } = await params;

  try {
    const admin = await requireAdmin();
    const event = await getOwnedEvent(admin.id, eventId);
    if (!event) {
      return NextResponse.json(
        { error: { code: "EVENT_NOT_FOUND", message: "Event not found." } },
        { status: 404 },
      );
    }

    const material = await retryQuizMaterialIndexing(eventId, materialId);
    return NextResponse.json({ material });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    console.error("Quiz material reindex failed:", error);
    return NextResponse.json(
      {
        error: {
          code: "INDEX_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to re-index material.",
        },
      },
      { status: 500 },
    );
  }
}
