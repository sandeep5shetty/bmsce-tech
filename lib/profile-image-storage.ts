import {
  deleteS3ObjectByUrl,
  extractS3KeyFromUrl,
  isS3Configured,
} from "@/lib/s3/storage";

export async function deleteStoredProfileImage(url: string): Promise<void> {
  if (!url || !isS3Configured()) return;

  const key = extractS3KeyFromUrl(url);
  if (!key?.startsWith("profiles/")) return;

  try {
    await deleteS3ObjectByUrl(url);
  } catch (error) {
    console.error("Error deleting S3 profile image:", error);
  }
}
