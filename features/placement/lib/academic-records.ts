import { eq } from "drizzle-orm";

import db from "@/db";
import {
  placementAcademicRecord,
  placementStudentProfile,
  user,
} from "@/db/schema";

export type AcademicRecordInput = {
  usn: string;
  name: string;
  batch?: string;
  tenthPercent: number;
  twelthPercent: number;
  pgCgpa?: number | null;
  degreeType?: string;
};

export async function upsertAcademicRecord(record: AcademicRecordInput) {
  const usn = record.usn.toUpperCase();

  await db
    .insert(placementAcademicRecord)
    .values({
      usn,
      name: record.name,
      batch: record.batch ?? "2024-26",
      tenthPercent: record.tenthPercent,
      twelthPercent: record.twelthPercent,
      pgCgpa: record.pgCgpa ?? undefined,
      degreeType: record.degreeType ?? "BCA",
    })
    .onConflictDoUpdate({
      target: placementAcademicRecord.usn,
      set: {
        name: record.name,
        batch: record.batch ?? "2024-26",
        tenthPercent: record.tenthPercent,
        twelthPercent: record.twelthPercent,
        pgCgpa: record.pgCgpa ?? undefined,
        degreeType: record.degreeType ?? "BCA",
      },
    });
}

export async function linkProfileFromAcademicRecord(
  usn: string,
  email: string,
): Promise<boolean> {
  const record = await db.query.placementAcademicRecord.findFirst({
    where: eq(placementAcademicRecord.usn, usn.toUpperCase()),
  });

  if (!record || record.pgCgpa === null) return false;

  const matchedUser = await db.query.user.findFirst({
    where: eq(user.email, email.toLowerCase()),
    columns: { id: true },
  });

  if (!matchedUser) return false;

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

  return true;
}

export async function syncAllAcademicProfilesFromDb(
  emailForUsn: (usn: string) => string | undefined,
) {
  const records = await db.select().from(placementAcademicRecord);

  let profilesLinked = 0;
  const skipped: string[] = [];

  for (const record of records) {
    if (record.pgCgpa === null) {
      skipped.push(`${record.name} (no MCA CGPA yet)`);
      continue;
    }

    const email = emailForUsn(record.usn);
    if (!email) continue;

    const linked = await linkProfileFromAcademicRecord(record.usn, email);
    if (linked) profilesLinked++;
  }

  return { recordCount: records.length, profilesLinked, skipped };
}
