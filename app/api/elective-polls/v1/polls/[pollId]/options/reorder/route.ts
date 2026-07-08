import { NextRequest, NextResponse } from "next/server";

import { reorderOptions } from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { reorderOptionsSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, reorderOptionsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const options = await reorderOptions(pollId, parsed.data);
    return NextResponse.json({ options });
  } catch (error) {
    return handlePollError(
      error,
      "UPDATE_FAILED",
      "Failed to reorder options.",
    );
  }
}
