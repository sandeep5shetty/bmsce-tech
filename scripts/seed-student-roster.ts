import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { sql as rawSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { student } from "../db/schema";
import { ADDITIONAL_ROSTER } from "../lib/students/additional-roster";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function main() {
  if (ADDITIONAL_ROSTER.length === 0) {
    console.log(
      "lib/students/additional-roster.ts is empty — nothing to seed.",
    );
    return;
  }

  console.log(`Upserting ${ADDITIONAL_ROSTER.length} roster rows by USN...`);

  await db
    .insert(student)
    .values(ADDITIONAL_ROSTER)
    .onConflictDoUpdate({
      target: student.usn,
      set: {
        name: rawSql`excluded.name`,
        section: rawSql`excluded.section`,
        email: rawSql`excluded.email`,
        batch: rawSql`excluded.batch`,
      },
    });

  console.log("Done. Roster upserted successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
