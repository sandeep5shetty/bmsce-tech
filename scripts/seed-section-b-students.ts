import { config } from "dotenv";

config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { SECTION_B_STUDENTS } from "../lib/students/section-b-roster";
import { student } from "../db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function main() {
  console.log(`Replacing student roster with ${SECTION_B_STUDENTS.length} Section B students...`);

  await db.delete(student);
  await db.insert(student).values(SECTION_B_STUDENTS);

  console.log("Done. Section B roster seeded successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
