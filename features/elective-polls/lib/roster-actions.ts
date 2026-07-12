"use server";

import { eq } from "drizzle-orm";

import db from "@/db";
import {
  electivePollAudienceExclusion,
  electivePollAudienceMember,
  student,
} from "@/db/schema";

import { PollApiError, requirePollAdmin } from "./auth";
import { isPgError } from "./seat-reservation";
import type { CreateStudentInput, UpdateStudentInput } from "./validation";

export interface RosterStudentWithUsage {
  id: string;
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string;
  /** Number of polls whose custom audience member/exclusion list references this student. */
  usageCount: number;
}

/**
 * Admin-only roster listing for the "Manage Students" page — includes a
 * precomputed per-student "used in N poll(s)" count so the delete
 * confirmation dialog can warn accurately without a second round trip,
 * mirroring elective-poll-card.tsx's precomputed hasResponses flag.
 */
export async function listStudentsWithUsage(): Promise<
  RosterStudentWithUsage[]
> {
  await requirePollAdmin();

  const [rows, memberRows, exclusionRows] = await Promise.all([
    db.query.student.findMany({ orderBy: student.name }),
    db
      .select({ studentId: electivePollAudienceMember.studentId })
      .from(electivePollAudienceMember),
    db
      .select({ studentId: electivePollAudienceExclusion.studentId })
      .from(electivePollAudienceExclusion),
  ]);

  const usage = new Map<string, number>();
  for (const { studentId } of [...memberRows, ...exclusionRows]) {
    usage.set(studentId, (usage.get(studentId) ?? 0) + 1);
  }

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    usn: s.usn,
    email: s.email,
    batch: s.batch,
    section: s.section,
    usageCount: usage.get(s.id) ?? 0,
  }));
}

function rethrowDuplicate(error: unknown): never {
  if (isPgError(error, "23505", "student_usn_unique")) {
    throw new PollApiError(
      "DUPLICATE_USN",
      "A student with this USN already exists.",
      409,
      "usn",
    );
  }
  if (isPgError(error, "23505", "student_email_unique")) {
    throw new PollApiError(
      "DUPLICATE_EMAIL",
      "A student with this email already exists.",
      409,
      "email",
    );
  }
  throw error;
}

export async function createStudent(data: CreateStudentInput) {
  await requirePollAdmin();
  try {
    const [row] = await db.insert(student).values(data).returning();
    if (!row)
      throw new PollApiError("CREATE_FAILED", "Failed to add student.", 500);
    return row;
  } catch (error) {
    rethrowDuplicate(error);
  }
}

export async function updateStudent(
  studentId: string,
  data: UpdateStudentInput,
) {
  await requirePollAdmin();
  try {
    const [row] = await db
      .update(student)
      .set(data)
      .where(eq(student.id, studentId))
      .returning();
    if (!row)
      throw new PollApiError("STUDENT_NOT_FOUND", "Student not found.", 404);
    return row;
  } catch (error) {
    rethrowDuplicate(error);
  }
}

export async function deleteStudent(studentId: string) {
  await requirePollAdmin();
  const [row] = await db
    .delete(student)
    .where(eq(student.id, studentId))
    .returning({ id: student.id });
  if (!row)
    throw new PollApiError("STUDENT_NOT_FOUND", "Student not found.", 404);
}
