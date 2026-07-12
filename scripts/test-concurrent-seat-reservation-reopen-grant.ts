/**
 * Empirical proof that a selective "reopen for these non-responders" grant
 * (elective_poll_reopen_grant) authorizes seat reservation on an otherwise
 * CLOSED poll with the exact same no-oversell guarantee as an open poll —
 * and that a student with no active grant still can't submit to a closed
 * poll, even when the option has plenty of spare capacity (proving the
 * EXISTS branch actually gates, rather than capacity happening to block it).
 *
 * Run against the real dev DB (this specifically tests Postgres/Neon row
 * locking behaviour, so it must not be mocked): `npx tsx scripts/test-concurrent-seat-reservation-reopen-grant.ts`
 *
 * NOTE: this duplicates the exact SQL from
 * features/elective-polls/lib/seat-reservation.ts rather than importing it,
 * for the same path-alias reason documented in
 * scripts/test-concurrent-seat-reservation.ts. Keep this SQL in sync if that
 * file changes.
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
  studentId: string | null;
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
        AND (
          p.status = 'open'
          OR EXISTS (
            SELECT 1 FROM elective_poll_reopen_grant g
            WHERE g.poll_id = p.id
              AND g.student_id = ${params.studentId}
              AND g.revoked_at IS NULL
          )
        )
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

async function createThrowawayStudent(label: string) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const [row] = await db
    .insert(schema.student)
    .values({
      name: label,
      usn: `TEST-${suffix}`,
      email: `${label}-${suffix}@test.local`,
      batch: "test-batch",
      section: "T",
    })
    .returning({ id: schema.student.id });
  return row.id;
}

async function createThrowawayClosedPoll(
  creatorId: string,
  optionCapacities: number[],
) {
  const [poll] = await db
    .insert(schema.electivePoll)
    .values({
      creatorId,
      title: `test-reopen-${crypto.randomUUID()}`,
      status: "closed",
    })
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
  const cleanupStudentIds: string[] = [];
  const cleanupPollIds: string[] = [];

  try {
    const adminId = await createThrowawayUser("admin");
    cleanupUserIds.push(adminId);

    // ── Scenario A: 8 concurrent GRANTED students, 1 option, capacity 5, poll CLOSED ──
    console.log(
      "Scenario A: 8 concurrent granted submissions against a 5-seat option on a CLOSED poll...",
    );
    const { pollId, optionIds } = await createThrowawayClosedPoll(adminId, [
      5,
    ]);
    cleanupPollIds.push(pollId);
    const optionId = optionIds[0];

    const participants = await Promise.all(
      Array.from({ length: 8 }, async (_, i) => {
        const userId = await createThrowawayUser(`grantee-${i}`);
        const studentId = await createThrowawayStudent(`grantee-${i}`);
        return { userId, studentId };
      }),
    );
    cleanupUserIds.push(...participants.map((p) => p.userId));
    cleanupStudentIds.push(...participants.map((p) => p.studentId));

    await db.insert(schema.electivePollReopenGrant).values(
      participants.map((p) => ({
        pollId,
        studentId: p.studentId,
        remarks: "test grant",
        grantedBy: adminId,
      })),
    );

    const results = await Promise.allSettled(
      participants.map((p) =>
        reserveSeat({
          pollId,
          optionId,
          userId: p.userId,
          studentId: p.studentId,
        }),
      ),
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

    // ── Scenario B: an UNGRANTED student on the same CLOSED poll must be rejected ──
    console.log(
      "\nScenario B: an ungranted student attempts the same CLOSED poll (option still has room)...",
    );
    const ungrantedUserId = await createThrowawayUser("no-grant");
    const ungrantedStudentId = await createThrowawayStudent("no-grant");
    cleanupUserIds.push(ungrantedUserId);
    cleanupStudentIds.push(ungrantedStudentId);

    // A fresh option with plenty of capacity, so a success here could only
    // be explained by the EXISTS grant-check failing to gate — not capacity.
    const { pollId: pollId2, optionIds: optionIds2 } =
      await createThrowawayClosedPoll(adminId, [10]);
    cleanupPollIds.push(pollId2);

    const ungrantedResult = await reserveSeat({
      pollId: pollId2,
      optionId: optionIds2[0],
      userId: ungrantedUserId,
      studentId: ungrantedStudentId,
    });
    console.log(`  ok=${ungrantedResult.ok} (expected false)`);
    if (ungrantedResult.ok) {
      failures++;
      console.error(
        "  FAIL: an ungranted student was able to submit to a closed poll — AUTHORIZATION BYPASS BUG",
      );
    }

    // ── Scenario C: a null studentId (unresolvable roster row) on a CLOSED poll must also be rejected ──
    console.log(
      "\nScenario C: a student with no roster row (studentId=null) attempts the same style of poll...",
    );
    const nullStudentUserId = await createThrowawayUser("null-student");
    cleanupUserIds.push(nullStudentUserId);
    const { pollId: pollId3, optionIds: optionIds3 } =
      await createThrowawayClosedPoll(adminId, [10]);
    cleanupPollIds.push(pollId3);

    const nullStudentResult = await reserveSeat({
      pollId: pollId3,
      optionId: optionIds3[0],
      userId: nullStudentUserId,
      studentId: null,
    });
    console.log(`  ok=${nullStudentResult.ok} (expected false)`);
    if (nullStudentResult.ok) {
      failures++;
      console.error(
        "  FAIL: a null studentId was able to submit to a closed poll — NULL COMPARISON BUG",
      );
    }
  } finally {
    console.log("\nCleaning up throwaway rows...");
    for (const pollId of cleanupPollIds) {
      await db
        .delete(schema.electivePoll)
        .where(eq(schema.electivePoll.id, pollId));
    }
    for (const studentId of cleanupStudentIds) {
      await db.delete(schema.student).where(eq(schema.student.id, studentId));
    }
    for (const userId of cleanupUserIds) {
      await db.delete(schema.user).where(eq(schema.user.id, userId));
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll reopen-grant concurrency checks PASSED.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
