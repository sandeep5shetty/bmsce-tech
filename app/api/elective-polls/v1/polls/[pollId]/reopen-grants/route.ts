import { NextRequest, NextResponse } from "next/server";

import { reopenPollForStudents } from "@/features/elective-polls/lib/reopen-grants";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { reopenGrantSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ pollId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { pollId } = await params;
  const parsed = await parseJsonBody(request, reopenGrantSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await reopenPollForStudents(
      pollId,
      parsed.data.studentIds,
      parsed.data.remarks,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handlePollError(
      error,
      "REOPEN_FAILED",
      "Failed to reopen the poll for the selected students.",
    );
  }
}
