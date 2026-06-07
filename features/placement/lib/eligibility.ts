// Pure eligibility helper — no "use server", importable on both client and server

export type ProfileSnapshot = {
  isPlacementEligible: boolean;
  pgCgpa: number;
  backlogCount: number;
  tenthPercent: number;
  twelthPercent: number;
  degreeCgpa: number | null;
  gender: string | null;
  category: string | null;
};

export type DriveSnapshot = {
  minPgCgpa: number;
  maxBacklogs: number;
  minTenthPercent: number;
  minTwelthPercent: number;
  minDegreeCgpa: number;
  genderAllowed: string;
  categoryAllowed: string;
};

export function getIneligibilityReasons(
  profile: ProfileSnapshot,
  drive: DriveSnapshot,
): string[] {
  const reasons: string[] = [];

  if (!profile.isPlacementEligible)
    reasons.push("You have been marked ineligible by your coordinator.");

  if (profile.pgCgpa < drive.minPgCgpa)
    reasons.push(
      `Your MCA CGPA (${profile.pgCgpa.toFixed(2)}) does not meet the required ${drive.minPgCgpa.toFixed(2)}.`,
    );

  if (profile.backlogCount > drive.maxBacklogs)
    reasons.push(
      `Your backlog count (${profile.backlogCount}) exceeds the allowed maximum (${drive.maxBacklogs}).`,
    );

  if (profile.tenthPercent < drive.minTenthPercent)
    reasons.push(
      `Your 10th percentage (${profile.tenthPercent.toFixed(1)}%) does not meet the required ${drive.minTenthPercent.toFixed(1)}%.`,
    );

  if (profile.twelthPercent < drive.minTwelthPercent)
    reasons.push(
      `Your 12th percentage (${profile.twelthPercent.toFixed(1)}%) does not meet the required ${drive.minTwelthPercent.toFixed(1)}%.`,
    );

  if (
    drive.minDegreeCgpa > 0 &&
    (profile.degreeCgpa === null || profile.degreeCgpa < drive.minDegreeCgpa)
  )
    reasons.push(
      `Your prior degree CGPA (${profile.degreeCgpa?.toFixed(2) ?? "not set"}) does not meet the required ${drive.minDegreeCgpa.toFixed(2)}.`,
    );

  if (drive.genderAllowed !== "All" && profile.gender !== drive.genderAllowed)
    reasons.push(`This drive is open to ${drive.genderAllowed} candidates only.`);

  if (drive.categoryAllowed !== "All" && profile.category !== drive.categoryAllowed)
    reasons.push(
      `This drive is open to ${drive.categoryAllowed} category candidates only.`,
    );

  return reasons;
}
