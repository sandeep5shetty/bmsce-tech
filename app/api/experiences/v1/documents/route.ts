import { NextRequest, NextResponse } from "next/server";

import {
  DOCUMENT_CONTENT_TYPES,
  experienceDocumentKeyFromUrl,
  getS3ObjectBuffer,
  isS3Configured,
} from "@/lib/s3/storage";

/**
 * Streams a stored JD or resource document back with a readable filename.
 * S3 keys are UUIDs, so hitting the bucket URL directly saves the file as
 * "9f2c….docx" — this route restores the name the author uploaded. PDFs are
 * sent inline so they preview in the browser; DOCX can only be downloaded.
 */
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
      {
        error: {
          code: "STORAGE_NOT_CONFIGURED",
          message: "File storage is not configured.",
        },
      },
      { status: 503 },
    );
  }

  const key = experienceDocumentKeyFromUrl(rawUrl);
  if (!key) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Document URL is not allowed." } },
      { status: 403 },
    );
  }

  try {
    const { body, contentType } = await getS3ObjectBuffer(key);

    const isPdf = contentType.includes("pdf");
    // Strip path separators and quotes so a crafted name cannot break out of
    // the Content-Disposition header.
    const requestedName = request.nextUrl.searchParams
      .get("name")
      ?.replace(/[\\/"\r\n]/g, "")
      .trim();
    const fallbackName = key.split("/").pop() ?? "document";
    const fileName = requestedName || fallbackName;

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": isPdf
          ? DOCUMENT_CONTENT_TYPES.pdf
          : (contentType ?? "application/octet-stream"),
        "Content-Disposition": `${isPdf ? "inline" : "attachment"}; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Experience document fetch failed:", error);
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Document not found." } },
      { status: 404 },
    );
  }
}
