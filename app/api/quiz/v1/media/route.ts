import { NextRequest, NextResponse } from "next/server";

import {
  extractS3KeyFromUrl,
  getS3ObjectBuffer,
  isAllowedQuizMediaKey,
  isS3Configured,
} from "@/lib/s3/storage";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "url is required." } },
      { status: 400 },
    );
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: { code: "STORAGE_NOT_CONFIGURED", message: "S3 is not configured." } },
      { status: 503 },
    );
  }

  const key = extractS3KeyFromUrl(rawUrl);
  if (!key || !isAllowedQuizMediaKey(key)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Media URL is not allowed." } },
      { status: 403 },
    );
  }

  try {
    const { body, contentType } = await getS3ObjectBuffer(key);

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Quiz media proxy failed:", error);
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Image not found." } },
      { status: 404 },
    );
  }
}
