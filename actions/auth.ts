"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import db from "@/db";
import { placementEmailMap } from "@/db/placement-email-map";
import { placementAcademicRecord, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { signInSchema, signUpSchema } from "@/validation/auth";

import { validateOrThrow } from "@/validation";

import { getUser } from "./user";

export async function signInSocial(provider: "google" | "github") {
  const { url, redirect: shouldRedirect } = await auth.api.signInSocial({
    body: { provider: provider, callbackURL: "/dashboard" },
  });

  if (shouldRedirect && url) {
    redirect(url);
  }
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  validateOrThrow(signInSchema, { email, password });

  const { user } = await auth.api.signInEmail({
    body: { email, password },
    headers: await headers(),
  });

  if (!user) {
    throw new Error("Failed to sign in");
  }

  return user;
}

export async function signUp({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  validateOrThrow(signUpSchema, { name, email, password });

  const { user } = await auth.api.signUpEmail({
    body: { name, email, password },
    headers: await headers(),
  });

  if (!user) {
    throw new Error("Failed to sign up");
  }

  auth.api.sendVerificationEmail({
    body: { email, callbackURL: "/dashboard" },
    headers: await headers(),
  });
}

export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  });

  revalidatePath("/dashboard");
}

export async function resendVerificationEmail() {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await auth.api.sendVerificationEmail({
    body: { email: user.email, callbackURL: "/dashboard" },
    headers: await headers(),
  });

  return { success: true };
}

// ── Student login (college email + USN as password) ────────────────────────

export async function studentSignIn(email: string, usn: string) {
  const emailLower = email.toLowerCase().trim();
  const usnUpper = usn.toUpperCase().trim();

  // Validate the combo against the official email map
  const mappedEmail = placementEmailMap[usnUpper];
  if (!mappedEmail || mappedEmail.toLowerCase() !== emailLower) {
    throw new Error("Invalid college email or USN. Please check your details and try again.");
  }

  const h = await headers();

  // Check if the user already has an account
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailLower),
    columns: { id: true },
  });

  if (existingUser) {
    // User exists — attempt sign-in with USN as password
    try {
      await auth.api.signInEmail({
        body: { email: emailLower, password: usnUpper },
        headers: h,
      });
    } catch {
      throw new Error(
        "This email is registered via a different method (e.g. Google). Please sign in with Google instead.",
      );
    }
    return { registered: false };
  }

  // New user — auto-register using name from academic record
  const record = await db.query.placementAcademicRecord.findFirst({
    where: eq(placementAcademicRecord.usn, usnUpper),
  });
  const name = record?.name ?? emailLower.split(".")[0];

  await auth.api.signUpEmail({
    body: { email: emailLower, password: usnUpper, name },
    headers: h,
  });

  return { registered: true };
}
