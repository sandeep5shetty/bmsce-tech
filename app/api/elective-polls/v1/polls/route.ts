import { NextRequest, NextResponse } from "next/server";

import { createPoll, listMyPolls } from "@/features/elective-polls/lib/actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { createPollSchema } from "@/features/elective-polls/lib/validation";

export async function GET() {
  try {
    const polls = await listMyPolls();
    return NextResponse.json({ polls });
  } catch (error) {
    return handlePollError(error, "FETCH_FAILED", "Failed to fetch polls.");
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, createPollSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const poll = await createPoll(parsed.data);
    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    return handlePollError(error, "CREATE_FAILED", "Failed to create poll.");
  }
}
