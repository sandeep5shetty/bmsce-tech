import { NextRequest, NextResponse } from "next/server";

import { searchRosterStudents } from "@/features/elective-polls/lib/actions";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const students = await searchRosterStudents(q);
    return NextResponse.json({ students });
  } catch (error) {
    return handlePollError(
      error,
      "SEARCH_FAILED",
      "Failed to search the roster.",
    );
  }
}
