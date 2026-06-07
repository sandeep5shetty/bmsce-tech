import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { placementAcademicData } from "../db/placement-academic-data";
import { placementAcademicRecord } from "../db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function main() {
  console.log(`Seeding ${placementAcademicData.length} academic records...`);

  for (const record of placementAcademicData) {
    await db
      .insert(placementAcademicRecord)
      .values({
        usn: record.usn,
        name: record.name,
        batch: record.batch,
        tenthPercent: record.tenthPercent,
        twelthPercent: record.twelthPercent,
        pgCgpa: record.pgCgpa ?? undefined,
        degreeType: record.degreeType,
      })
      .onConflictDoUpdate({
        target: placementAcademicRecord.usn,
        set: {
          name: record.name,
          tenthPercent: record.tenthPercent,
          twelthPercent: record.twelthPercent,
          pgCgpa: record.pgCgpa ?? undefined,
          degreeType: record.degreeType,
        },
      });
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
