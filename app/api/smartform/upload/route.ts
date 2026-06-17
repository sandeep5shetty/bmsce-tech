import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/lib/auth";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_SIZE = 16 * 1024 * 1024; // 16 MB

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { filename?: string; contentType?: string; size?: number; formId?: string };
  const { filename, contentType, size, formId } = body;

  if (!filename || !contentType || !formId) {
    return NextResponse.json({ error: "Missing filename, contentType, or formId" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "File type not allowed. Use PDF or image." }, { status: 400 });
  }

  if (size && size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 16 MB)" }, { status: 400 });
  }

  const ext = filename.split(".").pop() ?? "bin";
  const key = `smartforms/${formId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return NextResponse.json({ presignedUrl, publicUrl });
}
