import { NextRequest, NextResponse } from "next/server";

import {
  buildExperienceLogoKey,
  isS3Configured,
  uploadImageBuffer,
} from "@/lib/s3/storage";

import { getUser } from "@/actions/user";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};

const ALLOWED_MIME = new Set(Object.values(EXT_TO_MIME));

/**
 * Extension first, reported MIME type as fallback — same approach as the
 * document route, since browsers are inconsistent about both.
 */
function inferLogoType(file: File): { extension: string; mime: string } | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_TO_MIME[ext]) {
    return {
      extension: ext === "jpeg" ? "jpg" : ext,
      mime: EXT_TO_MIME[ext],
    };
  }

  if (file.type && ALLOWED_MIME.has(file.type)) {
    const match = Object.entries(EXT_TO_MIME).find(
      ([, mime]) => mime === file.type,
    );
    if (match) return { extension: match[0], mime: file.type };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to upload a logo." } },
      { status: 401 },
    );
  }

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
      {
        error: {
          code: "INVALID_FORM",
          message: "Expected multipart form data.",
        },
      },
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

  const logoType = inferLogoType(file);
  if (!logoType) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Use a PNG, JPG, WebP, or SVG image.",
          field: "file",
        },
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Logo must be 2 MB or smaller.",
          field: "file",
        },
      },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageBuffer({
      key: buildExperienceLogoKey(logoType.extension),
      body: buffer,
      contentType: logoType.mime,
      maxBytes: MAX_LOGO_BYTES,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Experience logo upload failed:", error);

    const awsError = error as Error & { Code?: string; name?: string };
    const message =
      awsError.name === "AccessDenied" || awsError.Code === "AccessDenied"
        ? "S3 upload denied. Check that your AWS IAM user can write to profiles/experiences/ in the bucket."
        : "Failed to upload logo.";

    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message } },
      { status: 500 },
    );
  }
}
