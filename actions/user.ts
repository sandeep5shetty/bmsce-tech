"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { eq } from "drizzle-orm";

import { editProfileSchema } from "@/features/profile/lib/validation";

import { auth } from "@/lib/auth";
import { deleteStoredProfileImage } from "@/lib/profile-image-storage";
import {
  extensionFromFile,
  uploadProfileImageBuffer,
} from "@/lib/profile-image-upload";
import { normalizeProfileImageUrl } from "@/lib/s3/profile-image";

import db from "@/db";
import { user } from "@/db/schema";
import { User } from "@/types";
import { validateOrThrow } from "@/validation";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function uploadProfilePicture(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false as const, error: "Unauthorized" };
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false as const, error: "No file provided" };
    }

    if (file.size > 4 * 1024 * 1024) {
      return { success: false as const, error: "File is too large. Maximum size is 4MB." };
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return {
        success: false as const,
        error: "Invalid file type. Please upload an image.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadProfileImageBuffer({
      userId: session.user.id,
      body: buffer,
      contentType: file.type,
      extension: extensionFromFile(file),
    });

    return { success: true as const, url };
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to upload profile picture",
    };
  }
}

export async function getIsCoordinator(): Promise<boolean> {
  const u = await getUser();
  return u?.isCoordinator ?? false;
}

export async function getUser(): Promise<User | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!userData) {
    return null;
  }

  return userData;
}

export async function updateUserProfile(data: {
  name: string;
  bio?: string;
  image?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  peerlist?: string;
  portfolio?: string;
}) {
  try {
    validateOrThrow(editProfileSchema, data);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current user to check for old image
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { image: true },
    });

    // Delete the previous stored image only when the storage key changes
    const previousImage = currentUser?.image;
    const nextImage = data.image;
    if (
      previousImage &&
      nextImage &&
      normalizeProfileImageUrl(previousImage) !== normalizeProfileImageUrl(nextImage)
    ) {
      await deleteStoredProfileImage(previousImage);
    }

    // Update user profile
    await db
      .update(user)
      .set({
        name: data.name.trim(),
        bio: data.bio?.trim() || null,
        image: data.image || null,
        github: data.github?.trim() || null,
        twitter: data.twitter?.trim() || null,
        linkedin: data.linkedin?.trim() || null,
        peerlist: data.peerlist?.trim() || null,
        portfolio: data.portfolio?.trim() || null,
      })
      .where(eq(user.id, session.user.id));

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/users/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
