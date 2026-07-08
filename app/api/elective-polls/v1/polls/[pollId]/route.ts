import { NextRequest, NextResponse } from "next/server";

import {
  deletePoll,
  getPoll,
  updatePollDetails,
} from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { updatePollDetailsSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  try {
    const poll = await getPoll(pollId);
    return NextResponse.json({ poll });
  } catch (error) {
    return handlePollError(error, "FETCH_FAILED", "Failed to fetch poll.");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, updatePollDetailsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const poll = await updatePollDetails(pollId, parsed.data);
    return NextResponse.json({ poll });
  } catch (error) {
    return handlePollError(error, "UPDATE_FAILED", "Failed to update poll.");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  try {
    await deletePoll(pollId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePollError(error, "DELETE_FAILED", "Failed to delete poll.");
  }
}
