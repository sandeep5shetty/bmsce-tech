/**
 * Seeds all 114 MCA 2024-26 students as registered users with:
 *   email    = college email from placement-email-map.ts
 *   password = USN in ALL CAPS  (e.g. 1BM25MC066)
 *
 * Also creates placement_student_profile for students who have an MCA CGPA.
 * Run: npx tsx scripts/seed-student-accounts.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../db/schema";
import { placementAcademicData } from "../db/placement-academic-data";
import { placementEmailMap } from "../db/placement-email-map";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

// Replicates Better Auth's password hashing exactly:
// scrypt(password, salt, { N: 16384, r: 16, p: 1, dkLen: 64 })  →  "salt:hash" (hex)
async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${bytesToHex(key)}`;
}

async function main() {
  let created = 0;
  let alreadyExists = 0;
  let profilesLinked = 0;
  let skippedNoEmail = 0;

  for (const student of placementAcademicData) {
    const email = placementEmailMap[student.usn];

    if (!email) {
      skippedNoEmail++;
      console.log(`  ⚠  No email mapped for ${student.usn} (${student.name})`);
      continue;
    }

    const emailLower = email.toLowerCase();
    const usnUpper = student.usn.toUpperCase();

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, emailLower),
      columns: { id: true },
    });

    if (existingUser) {
      alreadyExists++;
      // Ensure their credential account exists (they may have signed up via Google)
      const existingAccount = await db.query.account.findFirst({
        where: eq(schema.account.userId, existingUser.id),
        columns: { id: true, providerId: true },
      });
      const hasCredential = existingAccount?.providerId === "credential";
      if (!hasCredential) {
        // Add credential account so they can also log in with USN
        const hashedPw = await hashPassword(usnUpper);
        await db.insert(schema.account).values({
          id: crypto.randomUUID(),
          accountId: emailLower,
          providerId: "credential",
          userId: existingUser.id,
          password: hashedPw,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  + Added USN credential: ${student.name} (${email})`);
      }

      // Link profile if not yet linked and CGPA exists
      if (student.pgCgpa !== null) {
        const existingProfile = await db.query.placementStudentProfile.findFirst({
          where: eq(schema.placementStudentProfile.userId, existingUser.id),
          columns: { id: true },
        });
        if (!existingProfile) {
          await db.insert(schema.placementStudentProfile).values({
            userId: existingUser.id,
            pgCgpa: student.pgCgpa,
            hasBacklog: false,
            backlogCount: 0,
            isPlacementEligible: true,
            batch: student.batch,
            tenthPercent: student.tenthPercent,
            twelthPercent: student.twelthPercent,
            degreeType: student.degreeType,
            degreeCgpa: null,
            gender: null,
            category: null,
          });
          profilesLinked++;
        }
      }
      continue;
    }

    // New student — create user + credential account
    const userId = crypto.randomUUID();
    const hashedPw = await hashPassword(usnUpper);
    const now = new Date();

    await db.insert(schema.user).values({
      id: userId,
      name: student.name,
      email: emailLower,
      emailVerified: true,   // institutional email — skip verification
      createdAt: now,
      updatedAt: now,
      isCoordinator: false,
    });

    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: emailLower,
      providerId: "credential",
      userId,
      password: hashedPw,
      createdAt: now,
      updatedAt: now,
    });

    created++;
    console.log(`  ✓ Created: ${student.name} (${email})`);

    // Link placement profile if CGPA available
    if (student.pgCgpa !== null) {
      await db.insert(schema.placementStudentProfile).values({
        userId,
        pgCgpa: student.pgCgpa,
        hasBacklog: false,
        backlogCount: 0,
        isPlacementEligible: true,
        batch: student.batch,
        tenthPercent: student.tenthPercent,
        twelthPercent: student.twelthPercent,
        degreeType: student.degreeType,
        degreeCgpa: null,
        gender: null,
        category: null,
      });
      profilesLinked++;
    }
  }

  console.log("\n─── Summary ───────────────────────────────────────");
  console.log(`  Accounts created:    ${created}`);
  console.log(`  Already existed:     ${alreadyExists}`);
  console.log(`  Profiles linked:     ${profilesLinked}`);
  console.log(`  Skipped (no email):  ${skippedNoEmail}`);
  console.log("───────────────────────────────────────────────────");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
