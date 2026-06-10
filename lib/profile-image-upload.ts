import {
  isS3Configured,
  uploadProfileImageBuffer as uploadToS3,
} from "@/lib/s3/profile-image";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ALLOWED_EXTENSIONS.has(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  if (file.type.includes("gif")) return "gif";
  return "jpg";
}

export async function uploadProfileImageBuffer(params: {
  userId: string;
  body: Buffer;
  contentType: string;
  extension: string;
}): Promise<string> {
  if (!isS3Configured()) {
    throw new Error("Profile image storage is not configured");
  }

  return uploadToS3(params);
}
