import { NextResponse } from "next/server";

import { getQuestion } from "@/features/polls/lib/actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const q = await getQuestion(id);
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(q);
  } catch {
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}
