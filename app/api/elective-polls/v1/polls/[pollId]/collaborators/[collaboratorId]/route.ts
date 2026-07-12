import { NextRequest, NextResponse } from "next/server";

import { removeCollaborator } from "@/features/elective-polls/lib/collaborators";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

interface Params {
  params: Promise<{ pollId: string; collaboratorId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { pollId, collaboratorId } = await params;
  try {
    await removeCollaborator(pollId, collaboratorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePollError(
      error,
      "REMOVE_FAILED",
      "Failed to remove collaborator.",
    );
  }
}
