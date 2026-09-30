import { NextRequest, NextResponse } from "next/server";

import { isQuizApiError, quizErrorBody, requireAdmin } from "@/features/quiz/lib/auth";
import {
  listQuizEventMaterials,
  uploadAndIndexQuizMaterial,
} from "@/features/quiz/lib/quiz-materials";
import { getOwnedEvent } from "@/features/quiz/lib/quiz-materials-access";
import { isS3Configured } from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;

  try {
    const admin = await requireAdmin();
    const event = await getOwnedEvent(admin.id, eventId);
    if (!event) {
      return NextResponse.json(
        { error: { code: "EVENT_NOT_FOUND", message: "Event not found." } },
        { status: 404 },
      );
    }

    const materials = await listQuizEventMaterials(eventId);
    return NextResponse.json({ materials });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to load materials." } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;

  if (!isS3Configured()) {
    return NextResponse.json(
      {
        error: {
          code: "STORAGE_NOT_CONFIGURED",
          message: "File storage is not configured.",
        },
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_FORM", message: "Expected multipart form data." } },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "file is required.",
          field: "file",
        },
      },
      { status: 400 },
    );
  }

  try {
    const admin = await requireAdmin();
    const event = await getOwnedEvent(admin.id, eventId);
    if (!event) {
      return NextResponse.json(
        { error: { code: "EVENT_NOT_FOUND", message: "Event not found." } },
        { status: 404 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const material = await uploadAndIndexQuizMaterial({
      eventId,
      adminId: admin.id,
      fileName: file.name,
      contentType: file.type,
      buffer,
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    console.error("Quiz material upload failed:", error);
    return NextResponse.json(
      {
        error: {
          code: "UPLOAD_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to upload and index material.",
        },
      },
      { status: 500 },
    );
  }
}
