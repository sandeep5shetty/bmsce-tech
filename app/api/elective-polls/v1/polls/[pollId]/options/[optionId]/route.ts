import { NextRequest, NextResponse } from "next/server";

import {
  deleteOption,
  updateOption,
} from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { updateOptionSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string; optionId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { pollId, optionId } = await params;
  const parsed = await parseJsonBody(request, updateOptionSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const option = await updateOption(pollId, optionId, parsed.data);
    return NextResponse.json({ option });
  } catch (error) {
    return handlePollError(error, "UPDATE_FAILED", "Failed to update option.");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { pollId, optionId } = await params;
  try {
    await deleteOption(pollId, optionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePollError(error, "DELETE_FAILED", "Failed to delete option.");
  }
}
