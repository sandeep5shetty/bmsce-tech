import { NextResponse } from "next/server";

import { sql } from "drizzle-orm";

import db from "@/db";
import { student } from "@/db/schema";
import { SECTION_B_STUDENTS } from "@/lib/students/section-b-roster";

export async function POST() {
  try {
    // Replace entire roster so old USN formats are removed
    await db.delete(student);
    await db.insert(student).values(SECTION_B_STUDENTS);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(student);

    return NextResponse.json({
      success: true,
      message: `Roster updated. ${SECTION_B_STUDENTS.length} Section B students loaded (${count} total in DB).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
