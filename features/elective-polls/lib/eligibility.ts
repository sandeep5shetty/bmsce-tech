import { and, eq } from "drizzle-orm";

import db from "@/db";
import {
  electivePollAudienceExclusion,
  electivePollAudienceMember,
  student,
} from "@/db/schema";

import type { ElectivePollAudienceRuleRow } from "./types";

export type EligibilityResult =
  | { eligible: true; student: typeof student.$inferSelect | null }
  | { eligible: false; reason: "NOT_IN_ROSTER" | "AUDIENCE_MISMATCH" };

interface PollAudience {
  id: string;
  audienceMode: string; // 'all' | 'group' | 'custom'
}

/**
 * "all" is open to any authenticated user (mirrors the existing yes/no poll
 * feature's default). "group" requires the responder's roster row to match
 * the poll's single audience rule AND not be in the exclusion list. "custom"
 * requires the responder's roster row to be explicitly listed in
 * elective_poll_audience_member.
 */
export async function checkEligibility(
  poll: PollAudience,
  audienceRule: ElectivePollAudienceRuleRow | null,
  userEmail: string,
): Promise<EligibilityResult> {
  if (poll.audienceMode === "all") {
    return { eligible: true, student: null };
  }

  const studentRow = await db.query.student.findFirst({
    where: eq(student.email, userEmail.toLowerCase()),
  });

  if (!studentRow) {
    return { eligible: false, reason: "NOT_IN_ROSTER" };
  }

  if (poll.audienceMode === "group") {
    const matches =
      !!audienceRule &&
      audienceRule.batch === studentRow.batch &&
      (audienceRule.section === null ||
        audienceRule.section === studentRow.section);
    if (!matches) return { eligible: false, reason: "AUDIENCE_MISMATCH" };

    const excluded = await db.query.electivePollAudienceExclusion.findFirst({
      where: and(
        eq(electivePollAudienceExclusion.pollId, poll.id),
        eq(electivePollAudienceExclusion.studentId, studentRow.id),
      ),
    });
    if (excluded) return { eligible: false, reason: "AUDIENCE_MISMATCH" };
    return { eligible: true, student: studentRow };
  }

  // audienceMode === "custom"
  const membership = await db.query.electivePollAudienceMember.findFirst({
    where: and(
      eq(electivePollAudienceMember.pollId, poll.id),
      eq(electivePollAudienceMember.studentId, studentRow.id),
    ),
  });
  if (!membership) return { eligible: false, reason: "AUDIENCE_MISMATCH" };
  return { eligible: true, student: studentRow };
}
