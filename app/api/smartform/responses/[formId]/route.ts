import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import db from "@/db";
import { smartForm, smartResponse } from "@/db/schema";
import { auth } from "@/lib/auth";

type RouteContext = { params: Promise<{ formId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { formId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await db.query.smartForm.findFirst({
    where: eq(smartForm.id, formId),
    columns: { createdBy: true },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const responses = await db
    .select()
    .from(smartResponse)
    .where(eq(smartResponse.formId, formId))
    .orderBy(smartResponse.submittedAt);

  return NextResponse.json({ responses });
}
