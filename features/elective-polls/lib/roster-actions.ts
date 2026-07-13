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
import {
  createStudentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "./validation";

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

export interface ImportStudentsResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Bulk-imports parsed spreadsheet rows one at a time (not a single batched
 * insert) so a bad or duplicate row is skipped with a reason instead of
 * failing the entire file — mirroring the placement CSV bulk-upload route's
 * per-row error reporting.
 */
export async function importStudents(
  rows: unknown[],
): Promise<ImportStudentsResult> {
  await requirePollAdmin();

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    // +2: row 1 is the spreadsheet header, so the first data row is row 2.
    const rowNumber = i + 2;
    const parsed = createStudentSchema.safeParse(rows[i]);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      errors.push(`Row ${rowNumber}: ${issue?.message ?? "Invalid data."}`);
      continue;
    }
    try {
      await db.insert(student).values(parsed.data);
      imported++;
    } catch (error) {
      if (isPgError(error, "23505", "student_usn_unique")) {
        errors.push(
          `Row ${rowNumber} (${parsed.data.usn}): a student with this USN already exists.`,
        );
      } else if (isPgError(error, "23505", "student_email_unique")) {
        errors.push(
          `Row ${rowNumber} (${parsed.data.usn}): a student with this email already exists.`,
        );
      } else {
        throw error;
      }
    }
  }

  return { imported, skipped: rows.length - imported, errors };
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
