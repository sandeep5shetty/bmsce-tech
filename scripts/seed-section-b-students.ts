import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { student } from "../db/schema";
import {
  MCA_2025_27_BATCH,
  MCA_2025_27_ROSTER,
  SKIPPED_STUDENTS,
} from "../lib/students/mca-2025-27-roster";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

// "2025" was this cohort's old, incorrect batch label used before the real
// "2025-27" MCA batch identifier was known — replaced here too so no stale
// rows are left behind under the wrong label.
const LEGACY_BATCHES = ["2025", MCA_2025_27_BATCH];

async function main() {
  console.log(
    `Replacing MCA ${MCA_2025_27_BATCH} roster with ${MCA_2025_27_ROSTER.length} students (both sections)...`,
  );

  await db.delete(student).where(inArray(student.batch, LEGACY_BATCHES));
  await db.insert(student).values(MCA_2025_27_ROSTER);

  if (SKIPPED_STUDENTS.length > 0) {
    console.log(
      `Skipped ${SKIPPED_STUDENTS.length} student(s) with no official email on file:`,
      SKIPPED_STUDENTS.map((s) => `${s.name} (${s.usn})`).join(", "),
    );
  }

  console.log("Done. MCA 2025-27 roster seeded successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
