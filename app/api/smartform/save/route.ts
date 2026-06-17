import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db";
import { smartForm } from "@/db/schema";
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

  const { title, description, schema } = body as {
    title?: string;
    description?: string;
    schema?: unknown;
  };

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!schema) {
    return NextResponse.json({ error: "schema is required" }, { status: 400 });
  }

  try {
    const [inserted] = await db
      .insert(smartForm)
      .values({
        title: title.trim(),
        description: description?.trim() ?? null,
        schema,
        createdBy: session.user.id,
      })
      .returning({ id: smartForm.id });

    return NextResponse.json({ formId: inserted!.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save form" }, { status: 500 });
  }
}
