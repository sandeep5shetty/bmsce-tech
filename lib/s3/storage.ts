import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const DEFAULT_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function getS3Config() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!region || !bucket) {
    throw new Error("AWS S3 is not configured");
  }

  return { region, bucket };
}

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY,
  );
}

export function getS3PublicBaseUrl(): string {
  const custom = process.env.AWS_S3_PUBLIC_URL?.replace(/\/$/, "");
  if (custom) return custom;

  const { region, bucket } = getS3Config();
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function buildS3PublicUrl(key: string): string {
  return `${getS3PublicBaseUrl()}/${key}`;
}

export function extractS3KeyFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    const base = getS3PublicBaseUrl();
    if (url.startsWith(`${base}/`)) {
      return url.slice(base.length + 1).split("?")[0] ?? null;
    }

    const parsed = new URL(url);
    const { bucket } = getS3Config();
    const host = parsed.hostname;
    const isOurBucket =
      host === `${bucket}.s3.amazonaws.com` ||
      host.startsWith(`${bucket}.s3.`) ||
      host.startsWith(`${bucket}.`);

    if (isOurBucket) {
      const key = parsed.pathname.replace(/^\//, "").split("?")[0];
      return key || null;
    }

    const key = parsed.pathname.replace(/^\//, "").split("?")[0];
    return key || null;
  } catch {
    return null;
  }
}

const ALLOWED_MEDIA_PREFIXES = ["profiles/quiz/", "profiles/"] as const;

export function isAllowedQuizMediaKey(key: string): boolean {
  return ALLOWED_MEDIA_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Client-safe: resolve a stored S3 URL to an in-app media proxy path. */
export function resolveQuizMediaSrc(url: string | null | undefined): string {
  if (!url?.trim()) return "";

  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const key = parsed.pathname.replace(/^\//, "").split("?")[0];
    if (
      key &&
      isAllowedQuizMediaKey(key) &&
      parsed.hostname.includes("amazonaws.com")
    ) {
      return `/api/quiz/v1/media?url=${encodeURIComponent(trimmed)}`;
    }
  } catch {
    // Fall through to direct URL
  }

  return trimmed;
}

export async function getS3ObjectBuffer(key: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const { bucket } = getS3Config();
  const client = getS3Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Empty S3 object body");
  }

  const bytes = await response.Body.transformToByteArray();

  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}

export function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export function buildQuizEventLogoKey(
  eventId: string,
  extension: string,
): string {
  const ext = extension.replace(/^\./, "").toLowerCase() || "jpg";
  // Stored under profiles/quiz/ so the same IAM policy as profile avatars applies.
  return `profiles/quiz/events/${eventId}/logo.${ext}`;
}

export function buildQuizQuestionImageKey(
  eventId: string,
  questionId: string,
  extension: string,
): string {
  const ext = extension.replace(/^\./, "").toLowerCase() || "jpg";
  return `profiles/quiz/events/${eventId}/questions/${questionId}.${ext}`;
}

export function buildQuizUploadKey(extension: string): string {
  const ext = extension.replace(/^\./, "").toLowerCase() || "jpg";
  return `profiles/quiz/uploads/${crypto.randomUUID()}.${ext}`;
}

const DEFAULT_MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Document types accepted for placement-experience JDs and extra resources. */
export const DOCUMENT_CONTENT_TYPES: Record<"pdf" | "docx", string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Kept under profiles/ because the bucket's IAM policy only grants writes to
 * the profiles/ and smartforms/ prefixes — a bare "experiences/" key is
 * rejected with AccessDenied. Same reasoning as buildQuizEventLogoKey.
 *
 * Documents and logos get separate sub-prefixes so the document download route
 * (which forces Content-Disposition) can never be pointed at a logo image.
 */
const EXPERIENCE_PREFIX = "profiles/experiences/";
const EXPERIENCE_DOCUMENT_PREFIX = `${EXPERIENCE_PREFIX}documents/`;
const EXPERIENCE_LOGO_PREFIX = `${EXPERIENCE_PREFIX}logos/`;

export function buildExperienceDocumentKey(extension: string): string {
  const ext = extension.replace(/^\./, "").toLowerCase() || "pdf";
  return `${EXPERIENCE_DOCUMENT_PREFIX}${crypto.randomUUID()}.${ext}`;
}

export function isExperienceDocumentKey(key: string): boolean {
  return key.startsWith(EXPERIENCE_DOCUMENT_PREFIX);
}

export function buildExperienceLogoKey(extension: string): string {
  const ext = extension.replace(/^\./, "").toLowerCase() || "png";
  return `${EXPERIENCE_LOGO_PREFIX}${crypto.randomUUID()}.${ext}`;
}

/** True for any object this feature owns — used for cleanup on delete. */
export function isExperienceUploadKey(key: string): boolean {
  return key.startsWith(EXPERIENCE_PREFIX);
}

/** Resolves a stored URL to a key this feature owns, or null. */
export function experienceUploadKeyFromUrl(url: string): string | null {
  const key = extractS3KeyFromUrl(url);
  return key && isExperienceUploadKey(key) ? key : null;
}

/**
 * Resolves a stored document URL to the key we are willing to stream back.
 * Returns null for anything outside our own document prefix, so the download
 * route can never be pointed at an arbitrary object or host.
 */
export function experienceDocumentKeyFromUrl(url: string): string | null {
  const key = extractS3KeyFromUrl(url);
  return key && isExperienceDocumentKey(key) ? key : null;
}

export async function uploadDocumentBuffer(params: {
  key: string;
  body: Buffer;
  contentType: string;
  maxBytes?: number;
}): Promise<string> {
  const maxBytes = params.maxBytes ?? DEFAULT_MAX_DOCUMENT_BYTES;
  if (params.body.byteLength > maxBytes) {
    throw new Error("Document exceeds size limit");
  }

  const { bucket } = getS3Config();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
    }),
  );

  return buildS3PublicUrl(params.key);
}

export async function uploadImageBuffer(params: {
  key: string;
  body: Buffer;
  contentType: string;
  maxBytes?: number;
}): Promise<string> {
  const maxBytes = params.maxBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  if (params.body.byteLength > maxBytes) {
    throw new Error("Image exceeds size limit");
  }

  const { bucket } = getS3Config();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
    }),
  );

  return buildS3PublicUrl(params.key);
}

export async function deleteS3ObjectByUrl(url: string): Promise<void> {
  const key = extractS3KeyFromUrl(url);
  if (!key) return;

  const { bucket } = getS3Config();
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
