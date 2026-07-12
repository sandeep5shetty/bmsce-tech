"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { BMSCE_EMAIL_ERROR, isBmsceEmail } from "@/lib/bmsce-email";

import { signInSchema, signUpSchema } from "@/validation/auth";

import { validateOrThrow } from "@/validation";

import { getUser } from "./user";

export async function signInSocial(
  provider: "google" | "github",
  callbackUrl?: string,
) {
  const { url, redirect: shouldRedirect } = await auth.api.signInSocial({
    body: {
      provider,
      callbackURL: callbackUrl || "/dashboard",
      errorCallbackURL: "/auth/login",
    },
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

  if (!isBmsceEmail(email)) {
    throw new Error(BMSCE_EMAIL_ERROR);
  }

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

  if (!isBmsceEmail(email)) {
    throw new Error(BMSCE_EMAIL_ERROR);
  }

  const { user } = await auth.api.signUpEmail({
    body: { name, email, password },
    headers: await headers(),
  });

  if (!user) {
    throw new Error("Failed to sign up");
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email, callbackURL: "/dashboard" },
      headers: await headers(),
    });
  } catch (error) {
    // The account was already created successfully above, and email
    // verification isn't required to sign in — a delivery failure here
    // (e.g. email provider misconfigured) shouldn't surface as a fatal
    // error and strand the user with a "did my signup even work?" screen.
    console.error("Failed to send verification email:", error);
  }
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
