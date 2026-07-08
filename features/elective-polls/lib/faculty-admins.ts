/**
 * MCA department faculty — all automatically treated as elective-poll admins,
 * regardless of whether their `isElectivePollAdmin` DB flag is set. Mirrors
 * features/quiz/lib/admins.ts's QUIZ_ADMIN_EMAILS pattern: a plain email
 * allowlist checked at request time, so access works the moment someone
 * signs in — no pre-provisioning or grant-code step needed for this list.
 *
 * NOTE: "mca_office@bmsce.ac.in" cannot currently sign in at all — the
 * site's email format validation (lib/bmsce-email.ts) requires a dot in the
 * local part (name.branch@bmsce.ac.in) and this address has none. It's kept
 * here in case that address is corrected or the validation is relaxed later.
 */
export const ELECTIVE_POLL_FACULTY_EMAILS = [
  "uma.mca@bmsce.ac.in",
  "rmr.mca@bmsce.ac.in",
  "dns.mca@bmsce.ac.in",
  "vijaykumark.mca@bmsce.ac.in",
  "padmapriyav.mca@bmsce.ac.in",
  "gk.mca@bmsce.ac.in",
  "shailaja.mca@bmsce.ac.in",
  "rr.mca@bmsce.ac.in",
  "shilpa.mca@bmsce.ac.in",
  "sunithat.mca@bmsce.ac.in",
  "pushpa.mca@bmsce.ac.in",
  "veenar.mca@bmsce.ac.in",
  "mca_office@bmsce.ac.in",
] as const;

const facultyEmailSet = new Set<string>(
  ELECTIVE_POLL_FACULTY_EMAILS.map((email) => email.toLowerCase()),
);

export function isElectivePollFacultyEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return facultyEmailSet.has(email.toLowerCase().trim());
}
