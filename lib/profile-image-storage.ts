import { UTApi } from "uploadthing/server";

import { extractUploadThingKey } from "@/lib/utils";

import {
  deleteProfileImageByUrl,
  isS3ProfileImageUrl,
} from "./s3/profile-image";

const utapi = new UTApi();

export async function deleteStoredProfileImage(url: string): Promise<void> {
  if (isS3ProfileImageUrl(url)) {
    try {
      await deleteProfileImageByUrl(url);
    } catch (error) {
      console.error("Error deleting S3 profile image:", error);
    }
    return;
  }

  const uploadThingKey = extractUploadThingKey(url);
  if (uploadThingKey) {
    try {
      await utapi.deleteFiles(uploadThingKey);
    } catch (error) {
      console.error("Error deleting UploadThing profile image:", error);
    }
  }
}
