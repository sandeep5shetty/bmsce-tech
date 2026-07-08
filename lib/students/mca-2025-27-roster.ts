import studentDetails from "@/mca_2025_27_students.json";

import type { StudentSeed } from "./section-b-roster";

/** Full MCA 2025-27 roster (both sections), sourced directly from mca_2025_27_students.json. */
const rawStudents = studentDetails.students as {
  name: string;
  usn: string;
  section: string;
  email: string;
}[];

export const MCA_2025_27_BATCH = studentDetails.batch;

export const MCA_2025_27_ROSTER: (StudentSeed & { batch: string })[] =
  rawStudents.map((s) => ({
    name: s.name,
    usn: s.usn,
    section: s.section,
    email: s.email.toLowerCase(),
    batch: MCA_2025_27_BATCH,
  }));

// Kept so app/api/seed-students/route.ts and scripts/seed-section-b-students.ts
// (which report skipped students) don't need to change — every student in
// mca_2025_27_students.json has an email, so this is always empty now.
export const SKIPPED_STUDENTS: { name: string; usn: string }[] = [];
