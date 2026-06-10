import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024;

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

export function buildProfileImageKey(userId: string, extension: string): string {
  const ext = extension.replace(/^\./, "").toLowerCase() || "jpg";
  return `profiles/${userId}/avatar.${ext}`;
}

export function buildProfileImageUrl(key: string): string {
  return `${getS3PublicBaseUrl()}/${key}`;
}

export function normalizeProfileImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.split("?")[0]?.split("#")[0] ?? url;
  }
}

export function withProfileImageVersion(
  url: string,
  version: number | string = Date.now(),
): string {
  const base = normalizeProfileImageUrl(url);
  return `${base}?v=${version}`;
}

export function resolveProfileImageSrc(
  url: string | null | undefined,
  updatedAt?: Date | string | null,
): string {
  if (!url) return "";
  if (url.startsWith("blob:")) return url;
  if (/[?&]v=/.test(url)) return url;

  if (updatedAt) {
    const ts =
      updatedAt instanceof Date
        ? updatedAt.getTime()
        : new Date(updatedAt).getTime();
    if (!Number.isNaN(ts)) {
      return withProfileImageVersion(url, ts);
    }
  }

  return url;
}

export function isS3ProfileImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const base = getS3PublicBaseUrl();
    return url.startsWith(`${base}/profiles/`);
  } catch {
    return url.includes("/profiles/") && url.includes("amazonaws.com");
  }
}

export function extractS3ProfileKey(url: string): string | null {
  if (!url) return null;

  try {
    const base = getS3PublicBaseUrl();
    if (url.startsWith(`${base}/`)) {
      return url.slice(base.length + 1);
    }

    const parsed = new URL(url);
    const key = parsed.pathname.replace(/^\//, "");
    return key.startsWith("profiles/") ? key : null;
  } catch {
    return null;
  }
}

export function isMigratableExternalImageUrl(url: string): boolean {
  if (!url || isS3ProfileImageUrl(url)) return false;

  try {
    const host = new URL(url).hostname;
    return (
      host.includes("googleusercontent.com") ||
      host.endsWith("google.com") ||
      host.includes("githubusercontent.com") ||
      host.includes("gravatar.com")
    );
  } catch {
    return false;
  }
}

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function uploadProfileImageBuffer(params: {
  userId: string;
  body: Buffer;
  contentType: string;
  extension: string;
}): Promise<string> {
  if (params.body.byteLength > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile image exceeds 4MB limit");
  }

  const { bucket } = getS3Config();
  const client = getS3Client();
  const key = buildProfileImageKey(params.userId, params.extension);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
    }),
  );

  return withProfileImageVersion(buildProfileImageUrl(key));
}

export async function uploadProfileImageFromUrl(
  userId: string,
  sourceUrl: string,
): Promise<string | null> {
  if (!sourceUrl.startsWith("http")) return null;

  const response = await fetch(sourceUrl, {
    headers: { Accept: "image/*" },
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0) return null;

  return uploadProfileImageBuffer({
    userId,
    body: buffer,
    contentType,
    extension: extensionFromContentType(contentType),
  });
}

export async function deleteProfileImageByUrl(url: string): Promise<void> {
  const key = extractS3ProfileKey(url);
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

export async function syncExternalProfileImageToS3(
  userId: string,
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl || !isS3Configured() || !isMigratableExternalImageUrl(imageUrl)) {
    return null;
  }

  return uploadProfileImageFromUrl(userId, imageUrl);
}
