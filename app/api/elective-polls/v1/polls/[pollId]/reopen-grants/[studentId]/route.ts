import { NextRequest, NextResponse } from "next/server";

import { revokeReopenGrant } from "@/features/elective-polls/lib/reopen-grants";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

interface Params {
  params: Promise<{ pollId: string; studentId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { pollId, studentId } = await params;
  try {
    await revokeReopenGrant(pollId, studentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePollError(
      error,
      "REVOKE_FAILED",
      "Failed to revoke this student's reopen access.",
    );
  }
}
