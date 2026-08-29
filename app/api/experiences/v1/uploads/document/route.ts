import { NextRequest, NextResponse } from "next/server";

import {
  DOCUMENT_CONTENT_TYPES,
  buildExperienceDocumentKey,
  isS3Configured,
  uploadDocumentBuffer,
} from "@/lib/s3/storage";

import { getUser } from "@/actions/user";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

type DocumentType = keyof typeof DOCUMENT_CONTENT_TYPES;

/**
 * Browsers are inconsistent about the MIME type they attach to .docx (some send
 * an empty string, some send application/octet-stream), so the extension is the
 * primary signal and the reported MIME type is only a fallback.
 */
function inferDocumentType(file: File): DocumentType | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "docx") return ext;

  if (file.type === DOCUMENT_CONTENT_TYPES.pdf) return "pdf";
  if (file.type === DOCUMENT_CONTENT_TYPES.docx) return "docx";

  return null;
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("size limit")) {
      return "Document must be 10 MB or smaller.";
    }

    const awsError = error as Error & { Code?: string; name?: string };
    if (awsError.name === "AccessDenied" || awsError.Code === "AccessDenied") {
      return "S3 upload denied. Check that your AWS IAM user can write to profiles/experiences/ in the bucket.";
    }
  }

  return "Failed to upload document.";
}

export async function POST(request: NextRequest) {
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to upload files." } },
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

  const documentType = inferDocumentType(file);
  if (!documentType) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Only PDF and DOCX files are allowed.",
          field: "file",
        },
      },
      { status: 400 },
    );
  }

  // Checked here as well as in uploadDocumentBuffer so an oversized upload is
  // rejected before its bytes are buffered into memory.
  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Document must be 10 MB or smaller.",
          field: "file",
        },
      },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadDocumentBuffer({
      key: buildExperienceDocumentKey(documentType),
      body: buffer,
      contentType: DOCUMENT_CONTENT_TYPES[documentType],
      maxBytes: MAX_DOCUMENT_BYTES,
    });

    return NextResponse.json(
      {
        url,
        type: documentType,
        fileName: file.name,
        fileSize: buffer.byteLength,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Experience document upload failed:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: uploadErrorMessage(error) } },
      { status: 500 },
    );
  }
}
