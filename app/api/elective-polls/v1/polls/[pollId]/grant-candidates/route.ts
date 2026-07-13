import { NextResponse } from "next/server";

import { listGrantCandidates } from "@/features/elective-polls/lib/actions";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { pollId } = await params;
  try {
    const candidates = await listGrantCandidates(pollId);
    return NextResponse.json({ candidates });
  } catch (error) {
    return handlePollError(
      error,
      "FETCH_FAILED",
      "Failed to fetch grant candidates.",
    );
  }
}
