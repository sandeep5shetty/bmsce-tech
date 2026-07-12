import { NextRequest, NextResponse } from "next/server";

import { respondToInvite } from "@/features/elective-polls/lib/collaborators";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { respondToInviteSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ inviteId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { inviteId } = await params;
  const parsed = await parseJsonBody(request, respondToInviteSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await respondToInvite(inviteId, parsed.data.response);
    return NextResponse.json(result);
  } catch (error) {
    return handlePollError(
      error,
      "RESPOND_FAILED",
      "Failed to respond to invitation.",
    );
  }
}
