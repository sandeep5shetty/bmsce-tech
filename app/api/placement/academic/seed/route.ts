import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { getUser } from "@/actions/user";
import db from "@/db";
import { placementEmailMap } from "@/db/placement-email-map";
import {
  placementAcademicRecord,
  placementStudentProfile,
} from "@/db/schema";
import {
  linkProfileFromAcademicRecord,
  syncAllAcademicProfilesFromDb,
} from "@/features/placement/lib/academic-records";

function emailToUsn(email: string): string | null {
  const lower = email.toLowerCase();
  const entry = Object.entries(placementEmailMap).find(
    ([, v]) => v.toLowerCase() === lower,
  );
  return entry ? entry[0] : null;
}

/** Sync placement profiles from academic records already stored in the DB. */
export async function POST() {
  const currentUser = await getUser();
  if (!currentUser?.isCoordinator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recordCount, profilesLinked, skipped } =
    await syncAllAcademicProfilesFromDb((usn) => placementEmailMap[usn]);

  return NextResponse.json({
    success: true,
    recordCount,
    profilesLinked,
    skippedCount: skipped.length,
    message: `Synced ${profilesLinked} placement profiles from ${recordCount} academic records in the database. ${skipped.length} students skipped (no MCA CGPA).`,
  });
}

/** Auto-link the signed-in student from DB academic records. */
export async function GET() {
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = currentUser.email;
  if (!email.endsWith("@bmsce.ac.in")) {
    return NextResponse.json({ linked: false, reason: "non-bmsce email" });
  }

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

  const linked = await linkProfileFromAcademicRecord(usn, email);
  return NextResponse.json({
    linked,
    alreadyExists: false,
  });
}
