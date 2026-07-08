import { NextRequest, NextResponse } from "next/server";

import { listNonResponders } from "@/features/elective-polls/lib/actions";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  try {
    const students = await listNonResponders(pollId);
    return NextResponse.json({ students });
  } catch (error) {
    return handlePollError(
      error,
      "FETCH_FAILED",
      "Failed to fetch non-responders.",
    );
  }
}
