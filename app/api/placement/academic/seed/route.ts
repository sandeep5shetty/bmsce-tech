import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { getUser } from "@/actions/user";
import db from "@/db";
import { placementAcademicData } from "@/db/placement-academic-data";
import { placementEmailMap } from "@/db/placement-email-map";
import {
  placementAcademicRecord,
  placementStudentProfile,
  user,
} from "@/db/schema";

// Reverse lookup: email → USN from the official email map
function emailToUsn(email: string): string | null {
  const lower = email.toLowerCase();
  const entry = Object.entries(placementEmailMap).find(([, v]) => v.toLowerCase() === lower);
  return entry ? entry[0] : null;
}

export async function POST(req: NextRequest) {
  const currentUser = await getUser();
  if (!currentUser?.isCoordinator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let seeded = 0;
  let profilesLinked = 0;
  const skipped: string[] = [];

  for (const record of placementAcademicData) {
    // Upsert into academic records table
    await db
      .insert(placementAcademicRecord)
      .values({
        usn: record.usn,
        name: record.name,
        batch: record.batch,
        tenthPercent: record.tenthPercent,
        twelthPercent: record.twelthPercent,
        pgCgpa: record.pgCgpa ?? undefined,
        degreeType: record.degreeType,
      })
      .onConflictDoUpdate({
        target: placementAcademicRecord.usn,
        set: {
          name: record.name,
          tenthPercent: record.tenthPercent,
          twelthPercent: record.twelthPercent,
          pgCgpa: record.pgCgpa ?? undefined,
          degreeType: record.degreeType,
        },
      });
    seeded++;

    // Try to match to a registered user using the official email map
    if (record.pgCgpa === null) {
      skipped.push(`${record.name} (no MCA CGPA yet)`);
      continue;
    }

    const email = placementEmailMap[record.usn];
    if (!email) continue; // No email mapped (e.g. Akhilesh, Dayesh)

    const matchedUser = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });

    if (!matchedUser) continue;

    // Upsert placement profile for matched user
    const existing = await db.query.placementStudentProfile.findFirst({
      where: eq(placementStudentProfile.userId, matchedUser.id),
    });

    const profileValues = {
      pgCgpa: record.pgCgpa,
      hasBacklog: false,
      backlogCount: 0,
      isPlacementEligible: true,
      batch: record.batch,
      tenthPercent: record.tenthPercent,
      twelthPercent: record.twelthPercent,
      degreeType: record.degreeType,
      degreeCgpa: null,
      gender: null,
      category: null,
    };

    if (existing) {
      await db
        .update(placementStudentProfile)
        .set(profileValues)
        .where(eq(placementStudentProfile.userId, matchedUser.id));
    } else {
      await db.insert(placementStudentProfile).values({
        userId: matchedUser.id,
        ...profileValues,
      });
    }
    profilesLinked++;
  }

  return NextResponse.json({
    success: true,
    seeded,
    profilesLinked,
    skippedCount: skipped.length,
    message: `Seeded ${seeded} academic records. Linked ${profilesLinked} placement profiles. ${skipped.length} students skipped (no MCA CGPA).`,
  });
}

// GET — auto-seed a single student by their own email when they visit placement pages
export async function GET(req: NextRequest) {
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = currentUser.email;
  if (!email.endsWith("@bmsce.ac.in")) {
    return NextResponse.json({ linked: false, reason: "non-bmsce email" });
  }

  // Reverse-lookup USN from the official email map
  const usn = emailToUsn(email);
  if (!usn) {
    return NextResponse.json({ linked: false, reason: "email not in student map" });
  }

  const record = await db.query.placementAcademicRecord.findFirst({
    where: eq(placementAcademicRecord.usn, usn),
  });

  if (!record || record.pgCgpa === null) {
    return NextResponse.json({ linked: false, reason: "no record or no CGPA" });
  }

  const existing = await db.query.placementStudentProfile.findFirst({
    where: eq(placementStudentProfile.userId, currentUser.id),
  });

  if (existing) {
    return NextResponse.json({ linked: true, alreadyExists: true });
  }

  await db.insert(placementStudentProfile).values({
    userId: currentUser.id,
    pgCgpa: record.pgCgpa,
    hasBacklog: false,
    backlogCount: 0,
    isPlacementEligible: true,
    batch: record.batch,
    tenthPercent: record.tenthPercent,
    twelthPercent: record.twelthPercent,
    degreeType: record.degreeType,
    degreeCgpa: null,
    gender: null,
    category: null,
  });

  return NextResponse.json({ linked: true, alreadyExists: false });
}
