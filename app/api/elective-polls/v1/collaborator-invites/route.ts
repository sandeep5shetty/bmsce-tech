import { NextResponse } from "next/server";

import { listMyPendingInvites } from "@/features/elective-polls/lib/collaborators";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

export async function GET() {
  try {
    const invites = await listMyPendingInvites();
    return NextResponse.json({ invites });
  } catch (error) {
    return handlePollError(
      error,
      "FETCH_FAILED",
      "Failed to fetch pending invites.",
    );
  }
}
