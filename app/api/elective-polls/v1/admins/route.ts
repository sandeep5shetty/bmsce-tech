import { NextResponse } from "next/server";

import { listElectivePollAdmins } from "@/features/elective-polls/lib/collaborators";
import { handlePollError } from "@/features/elective-polls/lib/route-helpers";

export async function GET() {
  try {
    const admins = await listElectivePollAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    return handlePollError(
      error,
      "FETCH_FAILED",
      "Failed to fetch elective-poll admins.",
    );
  }
}
