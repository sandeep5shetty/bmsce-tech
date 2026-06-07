"use server";

import { revalidatePath } from "next/cache";

import { and, asc, count, desc, eq } from "drizzle-orm";

import { getUser } from "@/actions/user";

import db from "@/db";
import { placementEmailMap } from "@/db/placement-email-map";
import {
  placementAcademicRecord,
  placementDrive,
  placementResponse,
  placementStudentProfile,
  user,
} from "@/db/schema";

import { DashboardData, DashboardStudent } from "./types";
import { CreateDriveInput, UpsertProfileInput } from "./validation";
import { getIneligibilityReasons } from "./eligibility";

// ── Drive actions ──────────────────────────────────────────────────────────

export async function createDrive(data: CreateDriveInput) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const [drive] = await db
    .insert(placementDrive)
    .values({
      title: data.title,
      description: data.description || null,
      deadline: new Date(data.deadline),
      minPgCgpa: data.minPgCgpa,
      allowBacklog: data.allowBacklog,
      maxBacklogs: data.maxBacklogs,
      minTenthPercent: data.minTenthPercent,
      minTwelthPercent: data.minTwelthPercent,
      minDegreeCgpa: data.minDegreeCgpa,
      genderAllowed: data.genderAllowed,
      categoryAllowed: data.categoryAllowed,
    })
    .returning();

  if (!drive) throw new Error("Failed to create drive");

  revalidatePath("/placement");
  return drive;
}

export async function getAllDrives() {
  const drives = await db
    .select({
      id: placementDrive.id,
      title: placementDrive.title,
      description: placementDrive.description,
      deadline: placementDrive.deadline,
      minPgCgpa: placementDrive.minPgCgpa,
      allowBacklog: placementDrive.allowBacklog,
      maxBacklogs: placementDrive.maxBacklogs,
      minTenthPercent: placementDrive.minTenthPercent,
      minTwelthPercent: placementDrive.minTwelthPercent,
      minDegreeCgpa: placementDrive.minDegreeCgpa,
      genderAllowed: placementDrive.genderAllowed,
      categoryAllowed: placementDrive.categoryAllowed,
      isLocked: placementDrive.isLocked,
      createdAt: placementDrive.createdAt,
      responseCount: count(placementResponse.id),
    })
    .from(placementDrive)
    .leftJoin(placementResponse, eq(placementDrive.id, placementResponse.driveId))
    .groupBy(placementDrive.id)
    .orderBy(desc(placementDrive.createdAt));

  return drives;
}

export async function getDrive(id: string) {
  return db.query.placementDrive.findFirst({
    where: eq(placementDrive.id, id),
  });
}

export async function deleteDrive(id: string) {
  const currentUser = await getUser();
  if (!currentUser?.isCoordinator) throw new Error("Coordinator access required");

  await db.delete(placementDrive).where(eq(placementDrive.id, id));
  revalidatePath("/placement");
}

export async function lockDrive(id: string) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const existing = await db.query.placementDrive.findFirst({
    where: eq(placementDrive.id, id),
  });
  if (!existing) throw new Error("Drive not found");

  await db
    .update(placementDrive)
    .set({ isLocked: !existing.isLocked })
    .where(eq(placementDrive.id, id));

  revalidatePath(`/placement/dashboard/${id}`);
  revalidatePath("/placement");
}

export async function getDashboardData(driveId: string): Promise<DashboardData> {
  const drive = await db.query.placementDrive.findFirst({
    where: eq(placementDrive.id, driveId),
  });
  if (!drive) throw new Error("Drive not found");

  const profiles = await db
    .select({
      userId: placementStudentProfile.userId,
      pgCgpa: placementStudentProfile.pgCgpa,
      hasBacklog: placementStudentProfile.hasBacklog,
      backlogCount: placementStudentProfile.backlogCount,
      isPlacementEligible: placementStudentProfile.isPlacementEligible,
      batch: placementStudentProfile.batch,
      tenthPercent: placementStudentProfile.tenthPercent,
      twelthPercent: placementStudentProfile.twelthPercent,
      degreeType: placementStudentProfile.degreeType,
      degreeCgpa: placementStudentProfile.degreeCgpa,
      gender: placementStudentProfile.gender,
      category: placementStudentProfile.category,
      name: user.name,
      email: user.email,
    })
    .from(placementStudentProfile)
    .innerJoin(user, eq(placementStudentProfile.userId, user.id));

  const eligibleProfiles = profiles.filter(
    (p) => getIneligibilityReasons(p, drive).length === 0,
  );

  const responses = await db.query.placementResponse.findMany({
    where: eq(placementResponse.driveId, driveId),
  });
  const responseMap = new Map(responses.map((r) => [r.userId, r]));

  const registered: DashboardStudent[] = [];
  const notRegistered: DashboardStudent[] = [];
  const pending: DashboardStudent[] = [];

  for (const profile of eligibleProfiles) {
    const response = responseMap.get(profile.userId);
    const student: DashboardStudent = {
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      pgCgpa: profile.pgCgpa,
      hasBacklog: profile.hasBacklog,
      backlogCount: profile.backlogCount,
      batch: profile.batch,
      tenthPercent: profile.tenthPercent,
      twelthPercent: profile.twelthPercent,
      degreeType: profile.degreeType,
      degreeCgpa: profile.degreeCgpa,
      gender: profile.gender,
      category: profile.category,
      response: response
        ? { hasRegistered: response.hasRegistered, submittedAt: response.submittedAt }
        : null,
    };

    if (!response) {
      pending.push(student);
    } else if (response.hasRegistered) {
      registered.push(student);
    } else {
      notRegistered.push(student);
    }
  }

  return { drive, registered, notRegistered, pending };
}

// ── Profile actions ────────────────────────────────────────────────────────

export async function getAllProfiles() {
  return db
    .select({
      id: placementStudentProfile.id,
      userId: placementStudentProfile.userId,
      pgCgpa: placementStudentProfile.pgCgpa,
      hasBacklog: placementStudentProfile.hasBacklog,
      backlogCount: placementStudentProfile.backlogCount,
      isPlacementEligible: placementStudentProfile.isPlacementEligible,
      batch: placementStudentProfile.batch,
      tenthPercent: placementStudentProfile.tenthPercent,
      twelthPercent: placementStudentProfile.twelthPercent,
      degreeType: placementStudentProfile.degreeType,
      degreeCgpa: placementStudentProfile.degreeCgpa,
      gender: placementStudentProfile.gender,
      category: placementStudentProfile.category,
      createdAt: placementStudentProfile.createdAt,
      name: user.name,
      email: user.email,
    })
    .from(placementStudentProfile)
    .innerJoin(user, eq(placementStudentProfile.userId, user.id))
    .orderBy(user.name);
}

export async function upsertProfile(data: UpsertProfileInput) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const values = {
    pgCgpa: data.pgCgpa,
    hasBacklog: data.hasBacklog,
    backlogCount: data.backlogCount,
    isPlacementEligible: data.isPlacementEligible,
    batch: data.batch,
    tenthPercent: data.tenthPercent,
    twelthPercent: data.twelthPercent,
    degreeType: data.degreeType ?? null,
    degreeCgpa: data.degreeCgpa ?? null,
    gender: data.gender ?? null,
    category: data.category ?? null,
  };

  const existing = await db.query.placementStudentProfile.findFirst({
    where: eq(placementStudentProfile.userId, data.userId),
  });

  if (existing) {
    await db
      .update(placementStudentProfile)
      .set(values)
      .where(eq(placementStudentProfile.userId, data.userId));
  } else {
    await db.insert(placementStudentProfile).values({ userId: data.userId, ...values });
  }

  revalidatePath("/placement/profiles");
}

export async function getAllUsers() {
  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .orderBy(user.name);
}

export async function upsertProfileByCoordinator(
  targetUserId: string,
  data: UpsertProfileInput,
) {
  const currentUser = await getUser();
  if (!currentUser?.isCoordinator) throw new Error("Coordinator access required");
  await upsertProfile({ ...data, userId: targetUserId });
}

// ── Auto-seed from email map ───────────────────────────────────────────────

// Called server-side when a student visits the placement pages for the first time.
// Finds their USN via the email map, reads the academic record, and creates their profile.
export async function tryAutoSeedProfile(): Promise<boolean> {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.email.endsWith("@bmsce.ac.in")) return false;

  // Check if a profile already exists
  const existing = await db.query.placementStudentProfile.findFirst({
    where: eq(placementStudentProfile.userId, currentUser.id),
  });
  if (existing) return false; // Already seeded

  // Reverse-lookup USN from email map
  const emailLower = currentUser.email.toLowerCase();
  const usn = Object.entries(placementEmailMap).find(([, v]) => v.toLowerCase() === emailLower)?.[0];
  if (!usn) return false; // Not in our email map

  const record = await db.query.placementAcademicRecord.findFirst({
    where: eq(placementAcademicRecord.usn, usn),
  });
  if (!record || record.pgCgpa === null) return false; // No academic record or no CGPA yet

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

  revalidatePath("/placement");
  return true;
}

// ── Academic Records ───────────────────────────────────────────────────────

export async function getAllAcademicRecords() {
  const records = await db
    .select()
    .from(placementAcademicRecord)
    .orderBy(asc(placementAcademicRecord.name));

  // Find which USN emails are already linked
  const profiles = await db
    .select({ userId: placementStudentProfile.userId, email: user.email })
    .from(placementStudentProfile)
    .innerJoin(user, eq(placementStudentProfile.userId, user.id));

  const linkedEmails = new Set(profiles.map((p) => p.email.toLowerCase()));

  return records.map((r) => {
    const mappedEmail = placementEmailMap[r.usn];
    return {
      ...r,
      linked: !!mappedEmail && linkedEmails.has(mappedEmail.toLowerCase()),
    };
  });
}

export async function linkRecordToUser(usn: string, userId: string) {
  const currentUser = await getUser();
  if (!currentUser?.isCoordinator) throw new Error("Coordinator access required");

  const record = await db.query.placementAcademicRecord.findFirst({
    where: eq(placementAcademicRecord.usn, usn),
  });
  if (!record) throw new Error("Academic record not found");
  if (record.pgCgpa === null) throw new Error("Cannot link: student has no MCA CGPA yet");

  const existing = await db.query.placementStudentProfile.findFirst({
    where: eq(placementStudentProfile.userId, userId),
  });

  const values = {
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
      .set(values)
      .where(eq(placementStudentProfile.userId, userId));
  } else {
    await db.insert(placementStudentProfile).values({ userId, ...values });
  }

  revalidatePath("/placement/profiles");
}

// ── Eligibility + response ─────────────────────────────────────────────────

export async function checkEligibility(driveId: string, userId: string) {
  const drive = await db.query.placementDrive.findFirst({
    where: eq(placementDrive.id, driveId),
  });
  if (!drive) return { eligible: false as const, reasons: ["Drive not found"] };

  const profile = await db.query.placementStudentProfile.findFirst({
    where: eq(placementStudentProfile.userId, userId),
  });
  if (!profile)
    return {
      eligible: false as const,
      reasons: ["You don't have a placement profile. Contact your coordinator."],
    };

  const reasons = getIneligibilityReasons(profile, drive);
  if (reasons.length > 0) return { eligible: false as const, reasons };

  const existingResponse = await db.query.placementResponse.findFirst({
    where: and(
      eq(placementResponse.driveId, driveId),
      eq(placementResponse.userId, userId),
    ),
  });

  return {
    eligible: true as const,
    existingResponse: existingResponse
      ? { hasRegistered: existingResponse.hasRegistered, submittedAt: existingResponse.submittedAt }
      : null,
  };
}

export async function submitResponse(data: {
  driveId: string;
  userId: string;
  hasRegistered: boolean;
}) {
  const drive = await db.query.placementDrive.findFirst({
    where: eq(placementDrive.id, data.driveId),
  });
  if (!drive) throw new Error("Drive not found");
  if (drive.isLocked)
    throw new Error("This drive is locked and no longer accepting responses");

  const profile = await db.query.placementStudentProfile.findFirst({
    where: eq(placementStudentProfile.userId, data.userId),
  });
  if (!profile) throw new Error("Not eligible: no profile found");

  const reasons = getIneligibilityReasons(profile, drive);
  if (reasons.length > 0) throw new Error(`Not eligible: ${reasons[0]}`);

  const existing = await db.query.placementResponse.findFirst({
    where: and(
      eq(placementResponse.driveId, data.driveId),
      eq(placementResponse.userId, data.userId),
    ),
  });
  if (existing) throw new Error("Already submitted");

  await db.insert(placementResponse).values({
    driveId: data.driveId,
    userId: data.userId,
    hasRegistered: data.hasRegistered,
  });

  revalidatePath(`/placement/dashboard/${data.driveId}`);
}
