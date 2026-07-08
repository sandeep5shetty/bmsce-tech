import { NextRequest, NextResponse } from "next/server";

import { setAudience } from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { setAudienceSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, setAudienceSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const poll = await setAudience(pollId, parsed.data);
    return NextResponse.json({ poll });
  } catch (error) {
    return handlePollError(
      error,
      "UPDATE_FAILED",
      "Failed to update audience.",
    );
  }
}
