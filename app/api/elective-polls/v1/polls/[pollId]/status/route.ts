import { NextRequest, NextResponse } from "next/server";

import { setPollStatus } from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { updatePollStatusSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, updatePollStatusSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const poll = await setPollStatus(pollId, parsed.data.status);
    return NextResponse.json({ poll });
  } catch (error) {
    return handlePollError(
      error,
      "UPDATE_FAILED",
      "Failed to update poll status.",
    );
  }
}
