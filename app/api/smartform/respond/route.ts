import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db";
import { smartResponse } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { formId, answers } = body as { formId?: string; answers?: unknown };

  if (!formId || typeof formId !== "string") {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers is required" }, { status: 400 });
  }

  // Inject user email as the first answer so every submission is traceable
  const enrichedAnswers = {
    _email: session.user.email,
    ...(answers as Record<string, unknown>),
  };

  try {
    await db.insert(smartResponse).values({
      formId,
      answers: enrichedAnswers,
      submittedBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
