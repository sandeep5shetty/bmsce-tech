import { NextRequest, NextResponse } from "next/server";

import { getStudents } from "@/features/polls/lib/actions";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") ?? "";
    const students = await getStudents(search || undefined);
    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
