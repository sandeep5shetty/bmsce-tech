import { NextRequest, NextResponse } from "next/server";

import { getInviteForViewer } from "@/features/elective-polls/lib/collaborators";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

interface Params {
  params: Promise<{ inviteId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { inviteId } = await params;
  try {
    const invite = await getInviteForViewer(inviteId);
    return NextResponse.json({ invite });
  } catch (error) {
    return handlePollError(error, "FETCH_FAILED", "Failed to fetch invite.");
  }
}
