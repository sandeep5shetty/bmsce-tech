import { NextResponse } from "next/server";

import type { z } from "zod";

import { isPollApiError, pollErrorBody } from "./auth";

export function handlePollError(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string,
) {
  if (isPollApiError(error)) {
    return NextResponse.json(pollErrorBody(error), { status: error.status });
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: fallbackCode, message: fallbackMessage } },
    { status: 500 },
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON.",
          },
        },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: issue?.message ?? "Validation failed.",
            field: issue?.path[0]?.toString(),
          },
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
