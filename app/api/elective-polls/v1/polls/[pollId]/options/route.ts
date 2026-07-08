import { NextRequest, NextResponse } from "next/server";

import { addOption } from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { createOptionSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, createOptionSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const option = await addOption(pollId, parsed.data);
    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    return handlePollError(error, "CREATE_FAILED", "Failed to add option.");
  }
}
