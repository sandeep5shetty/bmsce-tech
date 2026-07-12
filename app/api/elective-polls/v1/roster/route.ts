import { NextRequest, NextResponse } from "next/server";

import {
  createStudent,
  listStudentsWithUsage,
} from "@/features/elective-polls/lib/roster-actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { createStudentSchema } from "@/features/elective-polls/lib/validation";

export async function GET() {
  try {
    const students = await listStudentsWithUsage();
    return NextResponse.json({ students });
  } catch (error) {
    return handlePollError(error, "FETCH_FAILED", "Failed to fetch roster.");
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, createStudentSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const student = await createStudent(parsed.data);
    return NextResponse.json({ student });
  } catch (error) {
    return handlePollError(error, "CREATE_FAILED", "Failed to add student.");
  }
}
