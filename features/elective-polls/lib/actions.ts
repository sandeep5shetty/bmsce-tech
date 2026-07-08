"use server";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { AGENTIC_AI_SHORTLIST_USNS } from "@/lib/electives/agentic-ai-shortlist";
import { MCA_2025_27_BATCH } from "@/lib/students/mca-2025-27-roster";

import { getUser } from "@/actions/user";

import db from "@/db";
import {
  electivePoll,
  electivePollAudienceExclusion,
  electivePollAudienceMember,
  electivePollAudienceRule,
  electivePollOption,
  electivePollResponse,
  student,
} from "@/db/schema";

import { PollApiError, requirePollAdmin } from "./auth";
import { checkEligibility } from "./eligibility";
import { broadcastPollEvent } from "./realtime";
import {
  RESPONSE_UNIQUE_CONSTRAINT,
  isPgError,
  reserveSeat,
} from "./seat-reservation";
import {
  type ElectivePollStatus,
  serializeOption,
  serializePoll,
  serializeResponse,
} from "./types";
import type {
  CreateOptionInput,
  CreatePollInput,
  ReorderOptionsInput,
  SetAudienceInput,
  UpdateOptionInput,
  UpdatePollDetailsInput,
} from "./validation";

const ALLOWED_STATUS_TRANSITIONS: Record<
  ElectivePollStatus,
  ElectivePollStatus[]
> = {
  draft: ["open"],
  open: ["closed"],
  closed: ["open"],
};

async function getOwnedPoll(creatorId: string, pollId: string) {
  return db.query.electivePoll.findFirst({
    where: and(
      eq(electivePoll.id, pollId),
      eq(electivePoll.creatorId, creatorId),
    ),
    with: {
      options: true,
      audienceRules: true,
      audienceMembers: { with: { student: true } },
      audienceExclusions: { with: { student: true } },
    },
  });
}

async function broadcastFreshSeatCounts(pollId: string) {
  const options = await db.query.electivePollOption.findMany({
    where: eq(electivePollOption.pollId, pollId),
  });
  await broadcastPollEvent(pollId, "seat_counts_changed", {
    options: options.map((o) => ({
      id: o.id,
      seatsTaken: o.seatsTaken,
      capacity: o.capacity,
      status: o.status,
    })),
  });
}

function isInvalidStudentReference(error: unknown): boolean {
  return isPgError(error, "23503");
}

// ── Admin: polls ─────────────────────────────────────────────────────────────

export async function listMyPolls() {
  const admin = await requirePollAdmin();
  const polls = await db.query.electivePoll.findMany({
    where: eq(electivePoll.creatorId, admin.id),
    orderBy: desc(electivePoll.createdAt),
    with: {
      options: true,
      audienceRules: true,
      audienceMembers: { with: { student: true } },
      audienceExclusions: { with: { student: true } },
    },
  });
  return polls.map((p) =>
    serializePoll(
      p,
      p.options,
      p.audienceRules,
      p.audienceMembers,
      p.audienceExclusions,
    ),
  );
}

export async function getPoll(pollId: string) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);
  return serializePoll(
    poll,
    poll.options,
    poll.audienceRules,
    poll.audienceMembers,
    poll.audienceExclusions,
  );
}

export async function createPoll(data: CreatePollInput) {
  const admin = await requirePollAdmin();
  let pollId: string | undefined;

  try {
    const [poll] = await db
      .insert(electivePoll)
      .values({
        creatorId: admin.id,
        title: data.title.trim(),
        description: data.description ?? null,
        closesAt: data.closesAt ? new Date(data.closesAt) : null,
        audienceMode: data.audienceMode,
      })
      .returning();
    if (!poll)
      throw new PollApiError("CREATE_FAILED", "Failed to create poll.", 500);
    pollId = poll.id;

    await db.insert(electivePollOption).values(
      data.options.map((opt, index) => ({
        pollId: poll.id,
        label: opt.label.trim(),
        description: opt.description ?? null,
        capacity: opt.capacity,
        position: index,
      })),
    );

    if (data.audienceMode === "group" && data.audienceRule) {
      await db.insert(electivePollAudienceRule).values({
        pollId: poll.id,
        batch: data.audienceRule.batch.trim(),
        section: data.audienceRule.section ?? null,
      });
      if (data.audienceExcludedStudentIds.length > 0) {
        await db.insert(electivePollAudienceExclusion).values(
          data.audienceExcludedStudentIds.map((studentId) => ({
            pollId: poll.id,
            studentId,
          })),
        );
      }
    } else if (
      data.audienceMode === "custom" &&
      data.audienceMemberStudentIds.length > 0
    ) {
      await db.insert(electivePollAudienceMember).values(
        data.audienceMemberStudentIds.map((studentId) => ({
          pollId: poll.id,
          studentId,
        })),
      );
    }

    const fullPoll = await getOwnedPoll(admin.id, poll.id);
    if (!fullPoll) {
      throw new PollApiError(
        "CREATE_FAILED",
        "Failed to load the created poll.",
        500,
      );
    }
    return serializePoll(
      fullPoll,
      fullPoll.options,
      fullPoll.audienceRules,
      fullPoll.audienceMembers,
      fullPoll.audienceExclusions,
    );
  } catch (error) {
    if (pollId) {
      await db
        .delete(electivePoll)
        .where(eq(electivePoll.id, pollId))
        .catch(() => {});
    }
    if (isInvalidStudentReference(error)) {
      throw new PollApiError(
        "INVALID_STUDENT_ID",
        "One or more selected students could not be found.",
        400,
        "audienceMemberStudentIds",
      );
    }
    if (isPgError(error, "23505")) {
      throw new PollApiError(
        "DUPLICATE_POLL_TITLE",
        "You already have a poll with this title.",
        409,
        "title",
      );
    }
    throw error;
  }
}

export async function updatePollDetails(
  pollId: string,
  data: UpdatePollDetailsInput,
) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const updates: Partial<typeof electivePoll.$inferInsert> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined)
    updates.description = data.description ?? null;
  if (data.closesAt !== undefined) {
    updates.closesAt = data.closesAt ? new Date(data.closesAt) : null;
  }

  try {
    const [updated] = await db
      .update(electivePoll)
      .set(updates)
      .where(eq(electivePoll.id, pollId))
      .returning();
    if (!updated)
      throw new PollApiError("UPDATE_FAILED", "Failed to update poll.", 500);
    return serializePoll(
      updated,
      poll.options,
      poll.audienceRules,
      poll.audienceMembers,
      poll.audienceExclusions,
    );
  } catch (error) {
    if (isPgError(error, "23505")) {
      throw new PollApiError(
        "DUPLICATE_POLL_TITLE",
        "You already have a poll with this title.",
        409,
        "title",
      );
    }
    throw error;
  }
}

export async function setPollStatus(pollId: string, status: "open" | "closed") {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const currentStatus = poll.status as ElectivePollStatus;
  if (!ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(status)) {
    throw new PollApiError(
      "INVALID_TRANSITION",
      `Cannot move a poll from "${currentStatus}" to "${status}".`,
      400,
    );
  }

  if (status === "open") {
    const activeOptions = poll.options.filter((o) => o.status === "active");
    if (activeOptions.length === 0) {
      throw new PollApiError(
        "NO_ACTIVE_OPTIONS",
        "Add at least one active option before opening the poll.",
        400,
      );
    }
  }

  const [updated] = await db
    .update(electivePoll)
    .set({ status })
    .where(eq(electivePoll.id, pollId))
    .returning();
  if (!updated)
    throw new PollApiError(
      "UPDATE_FAILED",
      "Failed to update poll status.",
      500,
    );

  await broadcastPollEvent(pollId, "poll_status_changed", {
    status: updated.status,
  });
  return serializePoll(
    updated,
    poll.options,
    poll.audienceRules,
    poll.audienceMembers,
    poll.audienceExclusions,
  );
}

export async function deletePoll(pollId: string) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  // Deleting a poll is a deliberate, explicitly-confirmed action (the client
  // shows a destructive confirmation dialog first, warning that responses
  // will be lost too) — so this permanently removes the poll AND all of its
  // responses, not just polls with zero responses.
  //
  // Responses are deleted explicitly before the poll, rather than relying
  // solely on elective_poll's ON DELETE CASCADE: elective_poll_response.option_id
  // is ON DELETE RESTRICT against elective_poll_option, and elective_poll_option
  // itself cascades from elective_poll. If Postgres happened to cascade-delete
  // the options before the responses in the same statement, that RESTRICT
  // constraint would block the whole delete. Removing responses first
  // sidesteps that ordering hazard entirely — nothing references the options
  // by the time they cascade away.
  await db
    .delete(electivePollResponse)
    .where(eq(electivePollResponse.pollId, pollId));
  await db.delete(electivePoll).where(eq(electivePoll.id, pollId));
}

// ── Admin: options ────────────────────────────────────────────────────────────

export async function addOption(pollId: string, data: CreateOptionInput) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);
  if (poll.status === "closed") {
    throw new PollApiError(
      "POLL_CLOSED",
      "Cannot add options to a closed poll.",
      400,
    );
  }

  const nextPosition =
    poll.options.length > 0
      ? Math.max(...poll.options.map((o) => o.position)) + 1
      : 0;

  const [option] = await db
    .insert(electivePollOption)
    .values({
      pollId,
      label: data.label.trim(),
      description: data.description ?? null,
      capacity: data.capacity,
      position: nextPosition,
    })
    .returning();
  if (!option)
    throw new PollApiError("CREATE_FAILED", "Failed to add option.", 500);

  await broadcastFreshSeatCounts(pollId);
  return serializeOption(option);
}

export async function updateOption(
  pollId: string,
  optionId: string,
  data: UpdateOptionInput,
) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const option = poll.options.find((o) => o.id === optionId);
  if (!option)
    throw new PollApiError("OPTION_NOT_FOUND", "Option not found.", 404);

  if (data.capacity !== undefined && data.capacity < option.seatsTaken) {
    throw new PollApiError(
      "CAPACITY_BELOW_TAKEN",
      `Capacity can't be lower than the ${option.seatsTaken} seat${option.seatsTaken === 1 ? "" : "s"} already taken.`,
      400,
      "capacity",
    );
  }

  const updates: Partial<typeof electivePollOption.$inferInsert> = {};
  if (data.label !== undefined) updates.label = data.label.trim();
  if (data.description !== undefined)
    updates.description = data.description ?? null;
  if (data.capacity !== undefined) updates.capacity = data.capacity;
  if (data.status !== undefined) updates.status = data.status;

  const [updated] = await db
    .update(electivePollOption)
    .set(updates)
    .where(eq(electivePollOption.id, optionId))
    .returning();
  if (!updated)
    throw new PollApiError("UPDATE_FAILED", "Failed to update option.", 500);

  await broadcastFreshSeatCounts(pollId);
  return serializeOption(updated);
}

export async function deleteOption(pollId: string, optionId: string) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const option = poll.options.find((o) => o.id === optionId);
  if (!option)
    throw new PollApiError("OPTION_NOT_FOUND", "Option not found.", 404);

  const [{ value: responseCount }] = await db
    .select({ value: count() })
    .from(electivePollResponse)
    .where(eq(electivePollResponse.optionId, optionId));

  if (responseCount > 0) {
    throw new PollApiError(
      "OPTION_HAS_RESPONSES",
      "This option already has responses — archive it instead of deleting.",
      400,
    );
  }

  await db
    .delete(electivePollOption)
    .where(eq(electivePollOption.id, optionId));
  await broadcastFreshSeatCounts(pollId);
}

export async function reorderOptions(
  pollId: string,
  data: ReorderOptionsInput,
) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const validIds = new Set(poll.options.map((o) => o.id));
  if (
    data.optionIds.length !== poll.options.length ||
    !data.optionIds.every((id) => validIds.has(id))
  ) {
    throw new PollApiError(
      "INVALID_OPTION_LIST",
      "The option list doesn't match this poll's options.",
      400,
    );
  }

  // Two-phase update: unique(pollId, position) would collide if rows were
  // updated directly to their final position in an arbitrary order.
  await Promise.all(
    data.optionIds.map((id, index) =>
      db
        .update(electivePollOption)
        .set({ position: index + 1000 })
        .where(eq(electivePollOption.id, id)),
    ),
  );
  await Promise.all(
    data.optionIds.map((id, index) =>
      db
        .update(electivePollOption)
        .set({ position: index })
        .where(eq(electivePollOption.id, id)),
    ),
  );

  const options = await db.query.electivePollOption.findMany({
    where: eq(electivePollOption.pollId, pollId),
  });
  return options.sort((a, b) => a.position - b.position).map(serializeOption);
}

// ── Admin: audience ───────────────────────────────────────────────────────────

export interface AudienceGroupStudent {
  id: string;
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string | null;
}

export interface AudienceGroup {
  key: string;
  batch: string;
  section: string | null;
  label: string;
  studentCount: number;
  /** Only set for "preset" groups that bundle a standing exclusion list (e.g. students already shortlisted elsewhere). */
  excludedStudents?: AudienceGroupStudent[];
}

function toAudienceGroupStudent(
  s: typeof student.$inferSelect,
): AudienceGroupStudent {
  return {
    id: s.id,
    name: s.name,
    usn: s.usn,
    email: s.email,
    batch: s.batch,
    section: s.section,
  };
}

/**
 * Selectable audience groups derived from the live student roster (e.g.
 * "MCA Batch 2025-27" for the whole batch, plus one entry per section
 * within it). Purely a UI convenience over the same batch/section rule
 * shape stored in elective_poll_audience_rule — adding a future batch to
 * the roster (via scripts/seed-student-roster.ts) makes it show up here
 * automatically, no code change needed.
 *
 * Also appends any standing "preset" groups (batch/section plus a baked-in
 * exclusion list, e.g. "...Excluding Agentic AI Students") defined in
 * lib/electives/*-shortlist.ts, resolved against the live roster by USN so
 * they stay correct even if roster rows are re-seeded.
 */
export async function listAudienceGroups(): Promise<AudienceGroup[]> {
  await requirePollAdmin();

  const rows = await db
    .select({
      batch: student.batch,
      section: student.section,
      studentCount: count(),
    })
    .from(student)
    .groupBy(student.batch, student.section);

  const batchTotals = new Map<string, number>();
  for (const row of rows) {
    batchTotals.set(
      row.batch,
      (batchTotals.get(row.batch) ?? 0) + row.studentCount,
    );
  }

  const groups: AudienceGroup[] = [];
  for (const [batch, total] of [...batchTotals.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    groups.push({
      key: `${batch}::all`,
      batch,
      section: null,
      label: `MCA Batch ${batch} (Both Sections)`,
      studentCount: total,
    });
  }
  for (const row of [...rows].sort(
    (a, b) =>
      a.batch.localeCompare(b.batch) || a.section.localeCompare(b.section),
  )) {
    groups.push({
      key: `${row.batch}::${row.section}`,
      batch: row.batch,
      section: row.section,
      label: `MCA Batch ${row.batch} (Section ${row.section})`,
      studentCount: row.studentCount,
    });
  }

  if (AGENTIC_AI_SHORTLIST_USNS.length > 0) {
    const shortlisted = await db.query.student.findMany({
      where: and(
        eq(student.batch, MCA_2025_27_BATCH),
        inArray(student.usn, AGENTIC_AI_SHORTLIST_USNS),
      ),
    });
    const batchTotal = batchTotals.get(MCA_2025_27_BATCH) ?? 0;
    if (shortlisted.length > 0) {
      groups.push({
        key: `${MCA_2025_27_BATCH}::all::excl-agentic-ai`,
        batch: MCA_2025_27_BATCH,
        section: null,
        label: `MCA Batch ${MCA_2025_27_BATCH} (Both Section A & B) - Excluding Agentic AI Students`,
        studentCount: Math.max(batchTotal - shortlisted.length, 0),
        excludedStudents: shortlisted.map(toAudienceGroupStudent),
      });
    }
  }

  return groups;
}

/**
 * Admin-only roster lookup backing the audience student pickers. Called with
 * no query to load the whole roster once (the picker then filters
 * client-side as the admin types) — the roster is small enough (~100s of
 * rows) that this is simpler and snappier than a debounced per-keystroke
 * server search, and avoids ever truncating results a user expects to see.
 */
export async function searchRosterStudents(query: string) {
  await requirePollAdmin();
  const q = query.trim();

  const rows = await db.query.student.findMany({
    where: q
      ? or(
          ilike(student.name, `%${q}%`),
          ilike(student.usn, `%${q}%`),
          ilike(student.email, `%${q}%`),
        )
      : undefined,
    orderBy: student.name,
    limit: 1000,
  });

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    usn: s.usn,
    email: s.email,
    batch: s.batch,
    section: s.section,
  }));
}

export async function setAudience(pollId: string, data: SetAudienceInput) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);
  if (poll.status !== "draft") {
    throw new PollApiError(
      "AUDIENCE_LOCKED",
      "Audience can only be changed while the poll is still a draft.",
      400,
    );
  }

  await db
    .delete(electivePollAudienceRule)
    .where(eq(electivePollAudienceRule.pollId, pollId));
  await db
    .delete(electivePollAudienceMember)
    .where(eq(electivePollAudienceMember.pollId, pollId));
  await db
    .delete(electivePollAudienceExclusion)
    .where(eq(electivePollAudienceExclusion.pollId, pollId));

  try {
    if (data.audienceMode === "group" && data.audienceRule) {
      await db.insert(electivePollAudienceRule).values({
        pollId,
        batch: data.audienceRule.batch.trim(),
        section: data.audienceRule.section ?? null,
      });
      if (data.audienceExcludedStudentIds.length > 0) {
        await db.insert(electivePollAudienceExclusion).values(
          data.audienceExcludedStudentIds.map((studentId) => ({
            pollId,
            studentId,
          })),
        );
      }
    } else if (
      data.audienceMode === "custom" &&
      data.audienceMemberStudentIds.length > 0
    ) {
      await db.insert(electivePollAudienceMember).values(
        data.audienceMemberStudentIds.map((studentId) => ({
          pollId,
          studentId,
        })),
      );
    }
  } catch (error) {
    if (isInvalidStudentReference(error)) {
      throw new PollApiError(
        "INVALID_STUDENT_ID",
        "One or more selected students could not be found.",
        400,
        "audienceMemberStudentIds",
      );
    }
    throw error;
  }

  await db
    .update(electivePoll)
    .set({ audienceMode: data.audienceMode })
    .where(eq(electivePoll.id, pollId));

  const updated = await getOwnedPoll(admin.id, pollId);
  if (!updated)
    throw new PollApiError("UPDATE_FAILED", "Failed to reload poll.", 500);
  return serializePoll(
    updated,
    updated.options,
    updated.audienceRules,
    updated.audienceMembers,
    updated.audienceExclusions,
  );
}

// ── Admin: responses ──────────────────────────────────────────────────────────

export async function listResponses(pollId: string) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const responses = await db.query.electivePollResponse.findMany({
    where: eq(electivePollResponse.pollId, pollId),
    orderBy: desc(electivePollResponse.submittedAt),
    with: {
      user: { columns: { email: true, name: true } },
      option: { columns: { label: true } },
    },
  });

  return responses.map((r) => ({
    ...serializeResponse(r),
    email: r.user.email,
    userName: r.user.name,
    optionLabel: r.option.label,
  }));
}

/**
 * Eligible-but-silent students: resolves the poll's eligible roster (per its
 * audienceMode) and subtracts anyone who already has a response, identified
 * by USN. Useful for the poll owner to know who still needs a nudge.
 */
export async function listNonResponders(pollId: string) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  let eligibleStudents: (typeof student.$inferSelect)[];
  if (poll.audienceMode === "all") {
    eligibleStudents = await db.query.student.findMany();
  } else if (poll.audienceMode === "group") {
    const rule = poll.audienceRules[0];
    const matched = rule
      ? await db.query.student.findMany({
          where: rule.section
            ? and(
                eq(student.batch, rule.batch),
                eq(student.section, rule.section),
              )
            : eq(student.batch, rule.batch),
        })
      : [];
    const excludedIds = new Set(
      poll.audienceExclusions.map((e) => e.studentId),
    );
    eligibleStudents = matched.filter((s) => !excludedIds.has(s.id));
  } else {
    eligibleStudents = poll.audienceMembers.map((m) => m.student);
  }

  const responded = await db
    .select({ usn: electivePollResponse.studentUsn })
    .from(electivePollResponse)
    .where(eq(electivePollResponse.pollId, pollId));
  const respondedUsns = new Set(
    responded.map((r) => r.usn).filter((usn): usn is string => !!usn),
  );

  return eligibleStudents
    .filter((s) => !respondedUsns.has(s.usn))
    .map((s) => ({
      id: s.id,
      name: s.name,
      usn: s.usn,
      email: s.email,
      batch: s.batch,
      section: s.section,
    }))
    .sort((a, b) => a.usn.localeCompare(b.usn));
}

// ── Public: respond page + submission ─────────────────────────────────────────

export async function getPollPublic(pollId: string) {
  const user = await getUser();
  if (!user)
    throw new PollApiError(
      "UNAUTHORIZED",
      "Please log in to view this poll.",
      401,
    );

  const poll = await db.query.electivePoll.findFirst({
    where: eq(electivePoll.id, pollId),
    with: { options: true, audienceRules: true },
  });
  if (!poll) {
    throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);
  }

  // Drafts are shown with a "not open yet" state rather than 404ing, so a
  // student who's been sent the link early sees a friendly explanation
  // instead of "not found". Eligibility/response lookups below are harmless
  // to compute either way — submission itself still requires status "open"
  // (enforced in submitResponse and, atomically, in reserveSeat).
  const eligibility = await checkEligibility(
    poll,
    poll.audienceRules[0] ?? null,
    user.email,
  );
  const myResponse = await db.query.electivePollResponse.findFirst({
    where: and(
      eq(electivePollResponse.pollId, pollId),
      eq(electivePollResponse.userId, user.id),
    ),
  });

  return {
    poll: serializePoll(poll, poll.options, poll.audienceRules),
    eligible: eligibility.eligible,
    ineligibleReason: eligibility.eligible ? null : eligibility.reason,
    myResponse: myResponse ? serializeResponse(myResponse) : null,
  };
}

export async function submitResponse(pollId: string, optionId: string) {
  const user = await getUser();
  if (!user) {
    throw new PollApiError(
      "UNAUTHORIZED",
      "You must be logged in to respond.",
      401,
    );
  }

  const poll = await db.query.electivePoll.findFirst({
    where: eq(electivePoll.id, pollId),
    with: { audienceRules: true },
  });
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);
  if (poll.status !== "open") {
    throw new PollApiError(
      "POLL_NOT_OPEN",
      "This poll is not currently open for responses.",
      409,
    );
  }

  const eligibility = await checkEligibility(
    poll,
    poll.audienceRules[0] ?? null,
    user.email,
  );
  if (!eligibility.eligible) {
    throw new PollApiError(
      "NOT_ELIGIBLE",
      eligibility.reason === "NOT_IN_ROSTER"
        ? "You're not part of the roster for this poll's audience."
        : "You're not part of the targeted audience for this poll.",
      403,
    );
  }

  const option = await db.query.electivePollOption.findFirst({
    where: and(
      eq(electivePollOption.id, optionId),
      eq(electivePollOption.pollId, pollId),
    ),
  });
  if (!option)
    throw new PollApiError(
      "OPTION_NOT_FOUND",
      "That option no longer exists.",
      404,
    );

  try {
    const result = await reserveSeat({
      pollId,
      optionId,
      userId: user.id,
      studentUsn: eligibility.student?.usn ?? null,
      studentName: eligibility.student?.name ?? user.name ?? null,
      studentBatch: eligibility.student?.batch ?? null,
      studentSection: eligibility.student?.section ?? null,
    });

    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        OPTION_NOT_FOUND: "That option no longer exists.",
        POLL_NOT_OPEN: "This poll is not currently open for responses.",
        OPTION_UNAVAILABLE: "This option is no longer available.",
        OPTION_FULL: "This option is full. Please choose another.",
      };
      throw new PollApiError(result.reason, messages[result.reason], 409);
    }

    return { responseId: result.responseId };
  } catch (error) {
    if (isPgError(error, "23505", RESPONSE_UNIQUE_CONSTRAINT)) {
      throw new PollApiError(
        "ALREADY_RESPONDED",
        "You've already submitted a response to this poll.",
        409,
      );
    }
    throw error;
  } finally {
    broadcastFreshSeatCounts(pollId).catch(() => {});
  }
}
