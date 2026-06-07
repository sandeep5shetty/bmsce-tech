import { NextResponse } from "next/server";

import { sql } from "drizzle-orm";

import db from "@/db";
import { student } from "@/db/schema";
import { STUDENTS_SEED } from "@/db/students-data";

export async function POST() {
  try {
    await db
      .insert(student)
      .values(STUDENTS_SEED)
      .onConflictDoNothing();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(student);

    return NextResponse.json({
      success: true,
      message: `Seed complete. Total students in DB: ${count}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
