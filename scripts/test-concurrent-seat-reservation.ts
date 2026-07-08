/**
 * Empirical proof that the atomic seat-reservation statement cannot oversell
 * a capacity-limited option under real concurrency, and that a student
 * racing two options at once can never end up with two responses.
 *
 * Run against the real dev DB (this specifically tests Postgres/Neon row
 * locking behaviour, so it must not be mocked): `npx tsx scripts/test-concurrent-seat-reservation.ts`
 *
 * NOTE: this duplicates the exact SQL from
 * features/elective-polls/lib/seat-reservation.ts rather than importing it,
 * because that module uses the "@/" path alias (which only Next.js's
 * bundler resolves) and every other script in this repo uses relative
 * imports for the same reason. Keep this SQL in sync if that file changes.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../db/schema";

config({ path: ".env.local" });

const dbClient = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: dbClient, schema });

type ReserveRow = {
  updated_option_id: string | null;
  response_id: string | null;
};

async function reserveSeat(params: {
  pollId: string;
  optionId: string;
  userId: string;
}): Promise<{ ok: boolean }> {
  const responseId = crypto.randomUUID();
  const result = await db.execute<ReserveRow>(sql`
    WITH updated_option AS (
      UPDATE elective_poll_option AS o
      SET seats_taken = o.seats_taken + 1, "updatedAt" = now()
      FROM elective_poll AS p
      WHERE o.id = ${params.optionId}
        AND o.poll_id = ${params.pollId}
        AND p.id = o.poll_id
        AND p.status = 'open'
        AND o.status = 'active'
        AND o.seats_taken < o.capacity
      RETURNING o.id
    ),
    inserted_response AS (
      INSERT INTO elective_poll_response (id, poll_id, option_id, user_id, submitted_at)
      SELECT ${responseId}, ${params.pollId}, uo.id, ${params.userId}, now()
      FROM updated_option uo
      RETURNING id
    )
    SELECT
      (SELECT id FROM updated_option) AS updated_option_id,
      (SELECT id FROM inserted_response) AS response_id
  `);
  return { ok: !!result.rows[0]?.updated_option_id };
}

// drizzle-orm's neon-http driver wraps the real NeonDbError (which carries
// code/constraint) inside a DrizzleQueryError whose own code/constraint are
// undefined — the real values live on `.cause`. Check both.
function isUniqueViolation(error: unknown, constraintName: string): boolean {
  for (const candidate of [error, (error as { cause?: unknown })?.cause]) {
    if (
      typeof candidate === "object" &&
      candidate !== null &&
      (candidate as { code?: string }).code === "23505" &&
      (candidate as { constraint?: string }).constraint === constraintName
    ) {
      return true;
    }
  }
  return false;
}

async function createThrowawayUser(label: string) {
  const [row] = await db
    .insert(schema.user)
    .values({
      email: `${label}-${crypto.randomUUID()}@test.local`,
      name: label,
    })
    .returning({ id: schema.user.id });
  return row.id;
}

async function createThrowawayPoll(
  creatorId: string,
  optionCapacities: number[],
) {
  const [poll] = await db
    .insert(schema.electivePoll)
    .values({ creatorId, title: `test-${crypto.randomUUID()}`, status: "open" })
    .returning();
  const options = await db
    .insert(schema.electivePollOption)
    .values(
      optionCapacities.map((capacity, index) => ({
        pollId: poll.id,
        label: `Option ${index}`,
        capacity,
        position: index,
      })),
    )
    .returning();
  return { pollId: poll.id, optionIds: options.map((o) => o.id) };
}

async function main() {
  let failures = 0;
  const cleanupUserIds: string[] = [];
  const cleanupPollIds: string[] = [];

  try {
    // ── Scenario A: 8 concurrent students, 1 option, capacity 5 ──────────────
    console.log(
      "Scenario A: 8 concurrent submissions against a 5-seat option...",
    );
    const adminId = await createThrowawayUser("admin");
    cleanupUserIds.push(adminId);

    const { pollId, optionIds } = await createThrowawayPoll(adminId, [5]);
    cleanupPollIds.push(pollId);
    const optionId = optionIds[0];

    const userIds = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        createThrowawayUser(`student-a-${i}`),
      ),
    );
    cleanupUserIds.push(...userIds);

    const results = await Promise.allSettled(
      userIds.map((userId) => reserveSeat({ pollId, optionId, userId })),
    );
    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok,
    ).length;
    const rejected = results.length - succeeded;

    console.log(
      `  succeeded=${succeeded} rejected=${rejected} (expected 5 / 3)`,
    );
    if (succeeded !== 5 || rejected !== 3) {
      failures++;
      console.error("  FAIL: expected exactly 5 successes and 3 rejections");
    }

    const [optionRow] = await db
      .select({ seatsTaken: schema.electivePollOption.seatsTaken })
      .from(schema.electivePollOption)
      .where(eq(schema.electivePollOption.id, optionId));
    console.log(`  seats_taken in DB = ${optionRow.seatsTaken} (expected 5)`);
    if (optionRow.seatsTaken !== 5) {
      failures++;
      console.error(
        "  FAIL: seats_taken does not equal 5 — OVERSELL OR UNDERCOUNT BUG",
      );
    }

    const [{ value: responseCount }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(schema.electivePollResponse)
      .where(eq(schema.electivePollResponse.pollId, pollId));
    console.log(`  response rows in DB = ${responseCount} (expected 5)`);
    if (responseCount !== 5) {
      failures++;
      console.error("  FAIL: response row count does not equal 5");
    }

    // ── Scenario B: same student racing two different options at once ───────
    console.log(
      "\nScenario B: one student submitting to two options concurrently...",
    );
    const { pollId: pollId2, optionIds: optionIds2 } =
      await createThrowawayPoll(adminId, [10, 10]);
    cleanupPollIds.push(pollId2);
    const raceUserId = await createThrowawayUser("student-b-race");
    cleanupUserIds.push(raceUserId);

    const raceResults = await Promise.allSettled([
      reserveSeat({
        pollId: pollId2,
        optionId: optionIds2[0],
        userId: raceUserId,
      }),
      reserveSeat({
        pollId: pollId2,
        optionId: optionIds2[1],
        userId: raceUserId,
      }),
    ]);

    const raceSuccesses = raceResults.filter(
      (r) => r.status === "fulfilled" && r.value.ok,
    ).length;
    const raceRejectedWithUniqueViolation = raceResults.filter(
      (r) =>
        r.status === "rejected" &&
        isUniqueViolation(r.reason, "elective_poll_response_poll_user_unique"),
    ).length;

    console.log(
      `  successes=${raceSuccesses} unique-violation-rejections=${raceRejectedWithUniqueViolation} (expected 1 / 1)`,
    );
    if (raceSuccesses !== 1 || raceRejectedWithUniqueViolation !== 1) {
      failures++;
      console.error(
        "  FAIL: expected exactly one success and one unique-violation rejection",
      );
    }

    const optionRows2 = await db
      .select({
        id: schema.electivePollOption.id,
        seatsTaken: schema.electivePollOption.seatsTaken,
      })
      .from(schema.electivePollOption)
      .where(eq(schema.electivePollOption.pollId, pollId2));
    const seatsSum = optionRows2.reduce((s, o) => s + o.seatsTaken, 0);
    console.log(
      `  total seats_taken across both options = ${seatsSum} (expected 1)`,
    );
    if (seatsSum !== 1) {
      failures++;
      console.error(
        "  FAIL: the losing option's seat increment was not rolled back — PHANTOM SEAT BUG",
      );
    }
  } finally {
    console.log("\nCleaning up throwaway rows...");
    for (const pollId of cleanupPollIds) {
      await db
        .delete(schema.electivePoll)
        .where(eq(schema.electivePoll.id, pollId));
    }
    for (const userId of cleanupUserIds) {
      await db.delete(schema.user).where(eq(schema.user.id, userId));
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll concurrency checks PASSED.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
