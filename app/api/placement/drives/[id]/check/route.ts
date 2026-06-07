import { NextResponse } from "next/server";

import { checkEligibility } from "@/features/placement/lib/actions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const result = await checkEligibility(id, userId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to check eligibility" }, { status: 500 });
  }
}
