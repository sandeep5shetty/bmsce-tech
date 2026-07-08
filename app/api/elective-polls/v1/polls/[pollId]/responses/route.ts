import { NextRequest, NextResponse } from "next/server";

import {
  listResponses,
  submitResponse,
} from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { submitResponseSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  try {
    const responses = await listResponses(pollId);
    return NextResponse.json({ responses });
  } catch (error) {
    return handlePollError(error, "FETCH_FAILED", "Failed to fetch responses.");
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, submitResponseSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await submitResponse(pollId, parsed.data.optionId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handlePollError(
      error,
      "SUBMIT_FAILED",
      "Failed to submit response.",
    );
  }
}
