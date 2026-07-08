import { sql } from "drizzle-orm";

import db from "@/db";

export type ReserveSeatResult =
  | { ok: true; responseId: string }
  | {
      ok: false;
      reason:
        | "OPTION_NOT_FOUND"
        | "POLL_NOT_OPEN"
        | "OPTION_UNAVAILABLE"
        | "OPTION_FULL";
    };

export const RESPONSE_UNIQUE_CONSTRAINT =
  "elective_poll_response_poll_user_unique";

/**
 * Matches a Postgres error by SQLSTATE code (and optionally constraint name).
 * drizzle-orm's neon-http driver wraps the underlying NeonDbError (which
 * carries `code`/`constraint` directly) inside a DrizzleQueryError, whose
 * `code`/`constraint` are undefined but whose `.cause` is the real
 * NeonDbError — so both the error itself and its `.cause` are checked.
 */
export function isPgError(
  error: unknown,
  code: string,
  constraintName?: string,
): boolean {
  for (const candidate of [error, (error as { cause?: unknown })?.cause]) {
    if (typeof candidate !== "object" || candidate === null) continue;
    if ((candidate as { code?: string }).code !== code) continue;
    if (
      !constraintName ||
      (candidate as { constraint?: string }).constraint === constraintName
    ) {
      return true;
    }
  }
  return false;
}

type ReserveSeatRow = {
  updated_option_id: string | null;
  response_id: string | null;
};

type DiagnosticRow = {
  poll_status: string;
  option_status: string;
  capacity: number;
  seats_taken: number;
};

/**
 * Atomically reserves one seat on `optionId` for `userId` and records the
 * response, or reports why it couldn't. This is a SINGLE Postgres statement
 * (the neon-http driver has no interactive multi-statement transactions —
 * every db.execute() call is its own independent HTTP round trip — so the
 * entire no-oversell guarantee has to live inside one statement).
 *
 * The UPDATE's WHERE clause checks the option's OWN live columns
 * (o.seats_taken, o.status) directly, not a value read in an earlier step.
 * That's what makes "check capacity and increment" safe under concurrency
 * without an explicit transaction: when Postgres acquires the row lock for
 * this UPDATE — possibly after waiting behind another concurrent submission
 * for the same option — it re-evaluates the WHERE clause against the
 * just-committed, up-to-date row, not a stale snapshot.
 *
 * If the student already has ANY response for this poll (including one
 * racing against a *different* option right now), the INSERT hits
 * elective_poll_response_poll_user_unique and Postgres raises a hard 23505
 * error. There is no ON CONFLICT DO NOTHING here — letting the error
 * propagate means Postgres rolls back the ENTIRE statement, including the
 * seats_taken increment the UPDATE had just computed a moment earlier, so a
 * rejected double-submit never leaves a phantom seat reserved.
 */
export async function reserveSeat(params: {
  pollId: string;
  optionId: string;
  userId: string;
  studentUsn: string | null;
  studentName: string | null;
  studentBatch: string | null;
  studentSection: string | null;
}): Promise<ReserveSeatResult> {
  const responseId = crypto.randomUUID();

  const result = await db.execute<ReserveSeatRow>(sql`
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
      INSERT INTO elective_poll_response
        (id, poll_id, option_id, user_id, student_usn, student_name, student_batch, student_section, submitted_at)
      SELECT ${responseId}, ${params.pollId}, uo.id, ${params.userId},
             ${params.studentUsn}, ${params.studentName}, ${params.studentBatch}, ${params.studentSection}, now()
      FROM updated_option uo
      RETURNING id
    )
    SELECT
      (SELECT id FROM updated_option) AS updated_option_id,
      (SELECT id FROM inserted_response) AS response_id
  `);

  const row = result.rows[0];
  if (row?.updated_option_id) {
    return { ok: true, responseId: row.response_id as string };
  }

  // The UPDATE matched 0 rows — figure out why with a plain diagnostic read.
  // This read is NOT used to gate anything and can be stale under a race;
  // it only decides the wording of the error shown to the user.
  const diag = await db.execute<DiagnosticRow>(sql`
    SELECT p.status AS poll_status, o.status AS option_status, o.capacity, o.seats_taken
    FROM elective_poll_option o
    JOIN elective_poll p ON p.id = o.poll_id
    WHERE o.id = ${params.optionId} AND o.poll_id = ${params.pollId}
  `);
  const d = diag.rows[0];
  if (!d) return { ok: false, reason: "OPTION_NOT_FOUND" };
  if (d.poll_status !== "open") return { ok: false, reason: "POLL_NOT_OPEN" };
  if (d.option_status !== "active") {
    return { ok: false, reason: "OPTION_UNAVAILABLE" };
  }
  return { ok: false, reason: "OPTION_FULL" };
}
