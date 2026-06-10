/** Official BMSCE email format: yourname.branch@bmsce.ac.in */
const BMSCE_EMAIL_REGEX = /^[a-z0-9]+(?:\.[a-z0-9]+)+@bmsce\.ac\.in$/;

/** MCA students use branch codes like mca25, mca24 in the local part. */
const MCA_BRANCH_REGEX = /^mca\d{2}$/;

export const BMSCE_EMAIL_ERROR =
  "Only BMSCE college email addresses are allowed. Use your official email in the format : yourname.branch@bmsce.ac.in";

export const BMSCE_EMAIL_ERROR_CODE = "bmsce_email_required";

export function isBmsceEmail(email: string): boolean {
  return BMSCE_EMAIL_REGEX.test(email.toLowerCase().trim());
}

export function isMcaStudentEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  if (!isBmsceEmail(normalized)) return false;

  const localPart = normalized.split("@")[0] ?? "";
  const branch = localPart.split(".").pop() ?? "";
  return MCA_BRANCH_REGEX.test(branch);
}

export function assertBmsceEmail(email: string | null | undefined): void {
  if (!email || !isBmsceEmail(email)) {
    throw new Error(BMSCE_EMAIL_ERROR);
  }
}
