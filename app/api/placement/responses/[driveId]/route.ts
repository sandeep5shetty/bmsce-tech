import { NextResponse } from "next/server";

import { getDashboardData } from "@/features/placement/lib/actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ driveId: string }> },
) {
  try {
    const { driveId } = await params;
    const data = await getDashboardData(driveId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch responses";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
