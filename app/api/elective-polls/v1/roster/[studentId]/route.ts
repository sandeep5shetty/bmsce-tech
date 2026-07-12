import { NextRequest, NextResponse } from "next/server";

import {
  deleteStudent,
  updateStudent,
} from "@/features/elective-polls/lib/roster-actions";
import {
  handlePollError,
  parseJsonBody,
} from "@/features/elective-polls/lib/route-helpers";
import { updateStudentSchema } from "@/features/elective-polls/lib/validation";

interface Params {
  params: Promise<{ studentId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { studentId } = await params;
  const parsed = await parseJsonBody(request, updateStudentSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const student = await updateStudent(studentId, parsed.data);
    return NextResponse.json({ student });
  } catch (error) {
    return handlePollError(
      error,
      "UPDATE_FAILED",
      "Failed to update student.",
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { studentId } = await params;
  try {
    await deleteStudent(studentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePollError(
      error,
      "DELETE_FAILED",
      "Failed to delete student.",
    );
  }
}
