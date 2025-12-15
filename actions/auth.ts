"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
