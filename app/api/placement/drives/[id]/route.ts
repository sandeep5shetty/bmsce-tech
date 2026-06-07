import { NextResponse } from "next/server";

import { getDrive } from "@/features/placement/lib/actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const drive = await getDrive(id);
    if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    return NextResponse.json(drive);
  } catch {
    return NextResponse.json({ error: "Failed to fetch drive" }, { status: 500 });
  }
}
