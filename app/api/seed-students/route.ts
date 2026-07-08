import { NextResponse } from "next/server";

import { inArray, sql } from "drizzle-orm";

import {
  MCA_2025_27_BATCH,
  MCA_2025_27_ROSTER,
  SKIPPED_STUDENTS,
} from "@/lib/students/mca-2025-27-roster";

import db from "@/db";
import { student } from "@/db/schema";

// "2025" was this cohort's old, incorrect batch label used before the real
// "2025-27" MCA batch identifier was known — replaced here too so no stale
// rows are left behind under the wrong label.
const LEGACY_BATCHES = ["2025", MCA_2025_27_BATCH];

export async function POST() {
  try {
    await db.delete(student).where(inArray(student.batch, LEGACY_BATCHES));
    await db.insert(student).values(MCA_2025_27_ROSTER);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(student);

    const skippedNote =
      SKIPPED_STUDENTS.length > 0
        ? ` Skipped ${SKIPPED_STUDENTS.length} student(s) with no official email on file: ${SKIPPED_STUDENTS.map((s) => `${s.name} (${s.usn})`).join(", ")}.`
        : "";

    return NextResponse.json({
      success: true,
      message: `Roster updated. ${MCA_2025_27_ROSTER.length} MCA ${MCA_2025_27_BATCH} students loaded (${count} total in DB).${skippedNote}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
