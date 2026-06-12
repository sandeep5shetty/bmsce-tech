import { config } from "dotenv";

config({ path: ".env.local" });

import { loadAcademicSeedData } from "./load-academic-seed-data";

async function main() {
  // Import after dotenv so @/db sees DATABASE_URL
  const { upsertAcademicRecord } = await import(
    "../features/placement/lib/academic-records"
  );

  const records = loadAcademicSeedData();
  console.log(`Seeding ${records.length} academic records into the database...`);

  for (const record of records) {
    await upsertAcademicRecord(record);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
