import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../db/schema";
import { placementEmailMap } from "../db/placement-email-map";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

async function main() {
  const records = await db.select().from(schema.placementAcademicRecord);
  console.log(`Found ${records.length} academic records.`);

  let linked = 0;
  let skippedNoCgpa = 0;
  let skippedNoEmail = 0;
  let skippedNoUser = 0;

  for (const record of records) {
    if (record.pgCgpa === null) {
      skippedNoCgpa++;
      continue;
    }

    const email = placementEmailMap[record.usn];
    if (!email) {
      skippedNoEmail++;
      console.log(`  No email mapped for ${record.usn} (${record.name})`);
      continue;
    }

    // Look up registered user by college email
    const matchedUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email.toLowerCase()),
      columns: { id: true, email: true },
    });

    if (!matchedUser) {
      skippedNoUser++;
      continue; // Student hasn't signed up yet
    }

    const vals = {
      pgCgpa: record.pgCgpa,
      hasBacklog: false,
      backlogCount: 0,
      isPlacementEligible: true,
      batch: record.batch,
      tenthPercent: record.tenthPercent,
      twelthPercent: record.twelthPercent,
      degreeType: record.degreeType,
      degreeCgpa: null as number | null,
      gender: null as string | null,
      category: null as string | null,
    };

    const existing = await db.query.placementStudentProfile.findFirst({
      where: eq(schema.placementStudentProfile.userId, matchedUser.id),
    });

    if (existing) {
      await db
        .update(schema.placementStudentProfile)
        .set(vals)
        .where(eq(schema.placementStudentProfile.userId, matchedUser.id));
    } else {
      await db.insert(schema.placementStudentProfile).values({
        userId: matchedUser.id,
        ...vals,
      });
    }

    console.log(`  Linked: ${record.name} → ${matchedUser.email}`);
    linked++;
  }

  console.log("\n─── Summary ───────────────────────────────");
  console.log(`  Linked:              ${linked}`);
  console.log(`  Skipped (no CGPA):   ${skippedNoCgpa}`);
  console.log(`  Skipped (no email):  ${skippedNoEmail}`);
  console.log(`  Not registered yet:  ${skippedNoUser}`);
  console.log("───────────────────────────────────────────");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
