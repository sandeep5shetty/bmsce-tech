import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";

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

  const schemaObj = form.schema as { fields?: Array<{ id: string; label: string }> };
  const fields = schemaObj?.fields ?? [];

  const rows = responses.map((r) => {
    const answers = r.answers as Record<string, unknown>;
    const row: Record<string, unknown> = {};
    for (const field of fields) {
      row[field.label] = answers[field.id] ?? "";
    }
    row["Submitted At"] = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "";
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r) => String(r[key] ?? "").length),
    ) + 2,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeTitle = form.title.replace(/[^a-z0-9]/gi, "_");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeTitle}_responses.xlsx"`,
    },
  });
}
