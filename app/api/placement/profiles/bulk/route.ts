import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { getUser } from "@/actions/user";
import db from "@/db";
import { placementEmailMap } from "@/db/placement-email-map";
import {
  placementAcademicRecord,
  placementStudentProfile,
  user,
} from "@/db/schema";

// Supported CSV formats (first row = headers, case-insensitive):
//
// Format A — academic data from PDF:
//   Name, USN, TenthPercent, TwelthPercent, MCA_CGPA
//   (seeds academic_record table + auto-links registered users)
//
// Format B — full profile override:
//   USN, PgCgpa, BacklogCount, Gender, Category, TenthPercent, TwelthPercent, DegreeType, DegreeCgpa

function parseNum(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function col(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name.toLowerCase().replace(/[_\s]/g, ""));
  return idx >= 0 ? (row[idx] ?? "").trim() : "";
}

export async function POST(req: Request) {
  try {
    const currentUser = await getUser();
    if (!currentUser?.isCoordinator) {
      return NextResponse.json({ error: "Coordinator access required" }, { status: 401 });
    }

    const body = await req.json();
    const csvText: string = body.csv;
    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 },
      );
    }

    // Normalise headers: lowercase, strip spaces/underscores
    const rawHeaders = lines[0].split(",").map((h) => h.trim());
    const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[_\s]/g, ""));

    // Detect format by which columns are present
    const hasName = headers.includes("name");
    const hasMcaCgpa =
      headers.includes("mcacgpa") ||
      headers.includes("mcagpa") ||
      headers.includes("cgpa");
    const isAcademicFormat = hasName && hasMcaCgpa;

    let recordsSeeded = 0;
    let profilesLinked = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((c) => c.trim());

      const usn = col(headers, row, "usn");
      if (!usn) {
        errors.push(`Row ${i + 1}: missing USN`);
        continue;
      }
      const usnUpper = usn.toUpperCase();

      if (isAcademicFormat) {
        // ── Format A: seed academic records ────────────────────────────────
        const name =
          col(headers, row, "name") ||
          col(headers, row, "studentname") ||
          "";

        const tenthRaw =
          col(headers, row, "tenthpercent") ||
          col(headers, row, "10th") ||
          col(headers, row, "10thpercent") ||
          col(headers, row, "10th%");
        const twelthRaw =
          col(headers, row, "twelthpercent") ||
          col(headers, row, "twelfthpercent") ||
          col(headers, row, "12th") ||
          col(headers, row, "12thpercent") ||
          col(headers, row, "12th%");
        const cgpaRaw =
          col(headers, row, "mcacgpa") ||
          col(headers, row, "mcagpa") ||
          col(headers, row, "cgpa") ||
          col(headers, row, "pgcgpa");

        const tenth = parseNum(tenthRaw);
        const twelth = parseNum(twelthRaw);
        const pgCgpa = parseNum(cgpaRaw);

        if (!name) {
          errors.push(`Row ${i + 1} (${usnUpper}): missing Name`);
          continue;
        }
        if (tenth === null || twelth === null) {
          errors.push(`Row ${i + 1} (${usnUpper}): missing 10th or 12th percent`);
          continue;
        }

        // Upsert academic record
        await db
          .insert(placementAcademicRecord)
          .values({
            usn: usnUpper,
            name,
            batch: "2024-26",
            tenthPercent: tenth,
            twelthPercent: twelth,
            pgCgpa: pgCgpa ?? undefined,
            degreeType: "BCA",
          })
          .onConflictDoUpdate({
            target: placementAcademicRecord.usn,
            set: {
              name,
              tenthPercent: tenth,
              twelthPercent: twelth,
              pgCgpa: pgCgpa ?? undefined,
            },
          });
        recordsSeeded++;

        // Auto-link if USN is in the email map and user has registered
        if (pgCgpa !== null) {
          const email = placementEmailMap[usnUpper];
          if (!email) continue; // No email mapped for this student
          const matchedUser = await db.query.user.findFirst({
            where: eq(user.email, email),
            columns: { id: true },
          });

          if (matchedUser) {
            const existing = await db.query.placementStudentProfile.findFirst({
              where: eq(placementStudentProfile.userId, matchedUser.id),
            });
            const vals = {
              pgCgpa,
              hasBacklog: false,
              backlogCount: 0,
              isPlacementEligible: true,
              batch: "2024-26",
              tenthPercent: tenth,
              twelthPercent: twelth,
              degreeType: "BCA",
              degreeCgpa: null,
              gender: null,
              category: null,
            };
            if (existing) {
              await db
                .update(placementStudentProfile)
                .set(vals)
                .where(eq(placementStudentProfile.userId, matchedUser.id));
            } else {
              await db
                .insert(placementStudentProfile)
                .values({ userId: matchedUser.id, ...vals });
            }
            profilesLinked++;
          }
        }
      } else {
        // ── Format B: full profile override ───────────────────────────────
        const email = placementEmailMap[usnUpper];
        if (!email) {
          errors.push(`Row ${i + 1} (${usnUpper}): no email mapping for this USN.`);
          continue;
        }
        const userRecord = await db.query.user.findFirst({
          where: eq(user.email, email),
          columns: { id: true },
        });

        if (!userRecord) {
          errors.push(
            `Row ${i + 1} (${usnUpper}): no user found with email ${email}. Student must sign in first.`,
          );
          continue;
        }

        const pgCgpa = parseNum(
          col(headers, row, "pgcgpa") || col(headers, row, "mcacgpa"),
        );
        const tenth = parseNum(col(headers, row, "tenthpercent"));
        const twelth = parseNum(col(headers, row, "twelthpercent"));
        const backlogCount = parseInt(col(headers, row, "backlogcount") || "0") || 0;
        const gender = col(headers, row, "gender") || null;
        const category = col(headers, row, "category") || null;
        const degreeType = col(headers, row, "degreetype") || null;
        const degreeCgpa = parseNum(col(headers, row, "degreecgpa"));

        if (pgCgpa === null) {
          errors.push(`Row ${i + 1} (${usnUpper}): missing MCA CGPA`);
          continue;
        }

        const vals = {
          pgCgpa,
          hasBacklog: backlogCount > 0,
          backlogCount,
          isPlacementEligible: true,
          batch: "2024-26",
          tenthPercent: tenth ?? 0,
          twelthPercent: twelth ?? 0,
          degreeType,
          degreeCgpa,
          gender,
          category,
        };

        const existing = await db.query.placementStudentProfile.findFirst({
          where: eq(placementStudentProfile.userId, userRecord.id),
        });
        if (existing) {
          await db
            .update(placementStudentProfile)
            .set(vals)
            .where(eq(placementStudentProfile.userId, userRecord.id));
        } else {
          await db
            .insert(placementStudentProfile)
            .values({ userId: userRecord.id, ...vals });
        }
        profilesLinked++;
      }
    }

    const message = isAcademicFormat
      ? `Seeded ${recordsSeeded} academic records. Auto-linked ${profilesLinked} student profiles.${errors.length ? ` ${errors.length} row(s) skipped.` : ""}`
      : `${profilesLinked} profile(s) updated.${errors.length ? ` ${errors.length} row(s) skipped.` : ""}`;

    return NextResponse.json({ success: true, message, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
