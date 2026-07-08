import { NextRequest, NextResponse } from "next/server";

import { getPollPublic } from "@/features/elective-polls/lib/actions";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  try {
    const payload = await getPollPublic(pollId);
    return NextResponse.json(payload);
  } catch (error) {
    return handlePollError(error, "FETCH_FAILED", "Failed to fetch poll.");
  }
}
