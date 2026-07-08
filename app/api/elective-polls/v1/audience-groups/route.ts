import { NextResponse } from "next/server";

import { listAudienceGroups } from "@/features/elective-polls/lib/actions";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

export async function GET() {
  try {
    const groups = await listAudienceGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    return handlePollError(
      error,
      "FETCH_FAILED",
      "Failed to fetch audience groups.",
    );
  }
}
