/** MCA Section B activity coordinators allowed to create and manage quizzes. */
export const QUIZ_ADMIN_EMAILS = [
  "prashantkumar.mca25@bmsce.ac.in",
  "rukkaiya.mca25@bmsce.ac.in",
  "saikumar.mca25@bmsce.ac.in",
  "sandeepanr.mca25@bmsce.ac.in",
  "tanishg.mca25@bmsce.ac.in",
  "tarunp.mca25@bmsce.ac.in",
  "tejdeepbn.mca25@bmsce.ac.in",
] as const;

const quizAdminEmailSet = new Set<string>(
  QUIZ_ADMIN_EMAILS.map((email) => email.toLowerCase()),
);

export function isQuizAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return quizAdminEmailSet.has(email.toLowerCase().trim());
}
