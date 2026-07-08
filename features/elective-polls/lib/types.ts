import type {
  electivePoll,
  electivePollAudienceExclusion,
  electivePollAudienceMember,
  electivePollAudienceRule,
  electivePollOption,
  electivePollResponse,
  student,
} from "@/db/schema";

export type ElectivePollStatus = "draft" | "open" | "closed";
export type ElectivePollOptionStatus = "active" | "archived";
export type ElectivePollAudienceMode = "all" | "group" | "custom";

export type ElectivePollRow = typeof electivePoll.$inferSelect;
export type ElectivePollOptionRow = typeof electivePollOption.$inferSelect;
export type ElectivePollAudienceRuleRow =
  typeof electivePollAudienceRule.$inferSelect;
export type ElectivePollAudienceMemberRow =
  typeof electivePollAudienceMember.$inferSelect;
export type ElectivePollAudienceExclusionRow =
  typeof electivePollAudienceExclusion.$inferSelect;
export type StudentRow = typeof student.$inferSelect;
export type ElectivePollResponseRow = typeof electivePollResponse.$inferSelect;

export function serializeOption(row: ElectivePollOptionRow) {
  return {
    id: row.id,
    pollId: row.pollId,
    label: row.label,
    description: row.description,
    capacity: row.capacity,
    seatsTaken: row.seatsTaken,
    seatsRemaining: Math.max(row.capacity - row.seatsTaken, 0),
    isFull: row.seatsTaken >= row.capacity,
    position: row.position,
    status: row.status as ElectivePollOptionStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeAudienceRule(row: ElectivePollAudienceRuleRow) {
  return {
    id: row.id,
    pollId: row.pollId,
    batch: row.batch,
    section: row.section,
  };
}

/** Shared shape for both allow-list ("custom" mode) and exclusion ("group" mode) rows. */
export function serializeAudienceStudentLink(
  row: { id: string; pollId: string } & { student: StudentRow },
) {
  return {
    id: row.id,
    pollId: row.pollId,
    student: {
      id: row.student.id,
      name: row.student.name,
      usn: row.student.usn,
      email: row.student.email,
      batch: row.student.batch,
      section: row.student.section,
    },
  };
}

export function serializePoll(
  row: ElectivePollRow,
  options: ElectivePollOptionRow[] = [],
  audienceRules: ElectivePollAudienceRuleRow[] = [],
  audienceMembers: (ElectivePollAudienceMemberRow & {
    student: StudentRow;
  })[] = [],
  audienceExclusions: (ElectivePollAudienceExclusionRow & {
    student: StudentRow;
  })[] = [],
) {
  return {
    id: row.id,
    creatorId: row.creatorId,
    title: row.title,
    description: row.description,
    status: row.status as ElectivePollStatus,
    audienceMode: row.audienceMode as ElectivePollAudienceMode,
    closesAt: row.closesAt ? row.closesAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    options: options
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(serializeOption),
    audienceRule:
      audienceRules.length > 0 ? serializeAudienceRule(audienceRules[0]) : null,
    audienceMembers: audienceMembers.map(serializeAudienceStudentLink),
    audienceExclusions: audienceExclusions.map(serializeAudienceStudentLink),
  };
}

export function serializeResponse(row: ElectivePollResponseRow) {
  return {
    id: row.id,
    pollId: row.pollId,
    optionId: row.optionId,
    userId: row.userId,
    studentUsn: row.studentUsn,
    studentName: row.studentName,
    studentBatch: row.studentBatch,
    studentSection: row.studentSection,
    submittedAt: row.submittedAt.toISOString(),
  };
}
