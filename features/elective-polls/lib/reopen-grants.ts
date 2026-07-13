"use server";

import { and, eq, isNull, sql } from "drizzle-orm";

import db from "@/db";
import { electivePollReopenGrant, student } from "@/db/schema";

import { getManagedPoll, listGrantCandidates } from "./actions";
import { PollApiError, requirePollAdmin } from "./auth";
import { broadcastPollEvent } from "./realtime";

export interface ActiveGrant {
  studentId: string | null;
  grant: { id: string; remarks: string; grantedAt: Date } | null;
}

/**
 * Resolves the requesting student's roster id (if any) and, when this poll
 * is closed, whether they currently hold an active (non-revoked) reopen
 * grant for it. Called only on the closed-poll path — for an open poll this
 * lookup is unnecessary, so callers should skip it entirely to avoid adding
 * a round trip to the far more common "poll is open" case.
 */
export async function resolveActiveGrant(
  pollId: string,
  userEmail: string,
): Promise<ActiveGrant> {
  const rows = await db
    .select({
      studentId: student.id,
      grantId: electivePollReopenGrant.id,
      remarks: electivePollReopenGrant.remarks,
      grantedAt: electivePollReopenGrant.grantedAt,
    })
    .from(student)
    .leftJoin(
      electivePollReopenGrant,
      and(
        eq(electivePollReopenGrant.studentId, student.id),
        eq(electivePollReopenGrant.pollId, pollId),
        isNull(electivePollReopenGrant.revokedAt),
      ),
    )
    .where(eq(student.email, userEmail.toLowerCase()))
    .limit(1);

  const row = rows[0];
  if (!row) return { studentId: null, grant: null };
  return {
    studentId: row.studentId,
    grant:
      row.grantId !== null && row.remarks !== null && row.grantedAt !== null
        ? { id: row.grantId, remarks: row.remarks, grantedAt: row.grantedAt }
        : null,
  };
}

/**
 * Grants a chosen subset of students the ability to submit to this poll even
 * though they wouldn't otherwise be authorized to — either because the poll
 * is closed (re-admitting a late non-responder), or because they were
 * missed out of the poll's audience entirely (wrong batch/section, absent
 * from a custom list, excluded), regardless of whether the poll is open or
 * closed. Candidates are validated against the live listGrantCandidates()
 * result (not trusted blindly from the client) so a stale selection — e.g.
 * someone who responded in the meantime — can't be granted. A grant does NOT
 * change poll.status or the poll's audience configuration; see
 * reserveSeat()'s WHERE clause and actions.ts's submitResponse/getPollPublic
 * for how it authorizes submission and eligibility instead.
 */
export async function reopenPollForStudents(
  pollId: string,
  studentIds: string[],
  remarks: string,
) {
  const admin = await requirePollAdmin();
  const poll = await getManagedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);
  if (poll.status === "draft") {
    throw new PollApiError(
      "POLL_IS_DRAFT",
      "This poll is still a draft — edit its audience directly instead of granting access.",
      400,
    );
  }

  const candidates = await listGrantCandidates(pollId);
  const validIds = new Set(candidates.map((s) => s.id));
  const validStudentIds = [...new Set(studentIds)].filter((id) =>
    validIds.has(id),
  );
  if (validStudentIds.length === 0) {
    throw new PollApiError(
      "INVALID_STUDENT_SELECTION",
      "None of the selected students can be granted access to this poll right now.",
      400,
    );
  }

  const trimmedRemarks = remarks.trim();

  await db
    .insert(electivePollReopenGrant)
    .values(
      validStudentIds.map((studentId) => ({
        pollId,
        studentId,
        remarks: trimmedRemarks,
        grantedBy: admin.id,
      })),
    )
    .onConflictDoUpdate({
      target: [
        electivePollReopenGrant.pollId,
        electivePollReopenGrant.studentId,
      ],
      targetWhere: sql`${electivePollReopenGrant.revokedAt} is null`,
      set: {
        remarks: trimmedRemarks,
        grantedBy: admin.id,
        grantedAt: sql`now()`,
      },
    });

  await broadcastPollEvent(pollId, "reopen_grants_changed", {
    studentIds: validStudentIds,
  });

  return { grantedCount: validStudentIds.length };
}

export async function revokeReopenGrant(pollId: string, studentId: string) {
  const admin = await requirePollAdmin();
  const poll = await getManagedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const [updated] = await db
    .update(electivePollReopenGrant)
    .set({ revokedAt: new Date(), revokedBy: admin.id })
    .where(
      and(
        eq(electivePollReopenGrant.pollId, pollId),
        eq(electivePollReopenGrant.studentId, studentId),
        isNull(electivePollReopenGrant.revokedAt),
      ),
    )
    .returning();

  if (!updated) {
    throw new PollApiError(
      "GRANT_NOT_FOUND",
      "No active reopen grant found for this student.",
      404,
    );
  }

  await broadcastPollEvent(pollId, "reopen_grants_changed", {
    studentIds: [studentId],
  });
}
