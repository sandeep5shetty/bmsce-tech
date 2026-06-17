import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, isQuizApiError, quizErrorBody } from "@/features/quiz/lib/auth";
import {
  buildQuizUploadKey,
  extensionFromContentType,
  isS3Configured,
  uploadImageBuffer,
} from "@/lib/s3/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

function inferContentType(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_TO_MIME[ext]) {
    return EXT_TO_MIME[ext];
  }

  return null;
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("size limit")) {
      return "Image must be 4 MB or smaller.";
    }

    const awsError = error as Error & { Code?: string; name?: string };
    if (
      awsError.name === "AccessDenied" ||
      awsError.Code === "AccessDenied"
    ) {
      return "S3 upload denied. Check that your AWS IAM user can write to profiles/quiz/ in the bucket.";
    }
  }

  return "Failed to upload image.";
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (isQuizApiError(error)) {
      return NextResponse.json(quizErrorBody(error), { status: error.status });
    }
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized." } },
      { status: 401 },
    );
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      {
        error: {
          code: "STORAGE_NOT_CONFIGURED",
          message: "AWS S3 is not configured.",
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
      { error: { code: "VALIDATION_ERROR", message: "file is required.", field: "file" } },
      { status: 400 },
    );
  }

  const contentType = inferContentType(file);
  if (!contentType) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Only JPEG, PNG, GIF, and WebP images are allowed.",
          field: "file",
        },
      },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = extensionFromContentType(contentType);
    const key = buildQuizUploadKey(extension);
    const url = await uploadImageBuffer({
      key,
      body: buffer,
      contentType,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Quiz image upload failed:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: uploadErrorMessage(error) } },
      { status: 500 },
    );
  }
}
