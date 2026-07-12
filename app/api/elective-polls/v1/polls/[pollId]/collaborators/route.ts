import { NextRequest, NextResponse } from "next/server";

import {
  inviteCollaborators,
  listCollaborators,
} from "@/features/elective-polls/lib/collaborators";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { inviteCollaboratorsSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  try {
    const collaborators = await listCollaborators(pollId);
    return NextResponse.json({ collaborators });
  } catch (error) {
    return handlePollError(
      error,
      "FETCH_FAILED",
      "Failed to fetch collaborators.",
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, inviteCollaboratorsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await inviteCollaborators(pollId, parsed.data.emails);
    return NextResponse.json(result);
  } catch (error) {
    return handlePollError(
      error,
      "INVITE_FAILED",
      "Failed to invite collaborators.",
    );
  }
}
