import { headers } from "next/headers";

/** Authenticated server-side fetch to quiz API routes. */
export async function quizApiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  return fetch(`${base}/api/quiz/v1${path}`, {
    ...init,
    headers: {
      cookie: h.get("cookie") ?? "",
      ...init?.headers,
    },
    cache: "no-store",
  });
}
