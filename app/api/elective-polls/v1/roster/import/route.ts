import { NextRequest, NextResponse } from "next/server";

import { importStudents } from "@/features/elective-polls/lib/roster-actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { importStudentsSchema } from "@/features/elective-polls/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, importStudentsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await importStudents(parsed.data.rows);
    return NextResponse.json(result);
  } catch (error) {
    return handlePollError(error, "IMPORT_FAILED", "Failed to import students.");
  }
}
