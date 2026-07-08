import type { StudentSeed } from "./section-b-roster";

/**
 * Add students for new batches/sections here, then run `npm run seed:roster`.
 * Safe to re-run — upserts by USN, never touches other batches' rows.
 *
 * Example:
 * { name: "Jane Doe", usn: "1BM26MC001", section: "A", email: "jane.mca26@bmsce.ac.in", batch: "2026" }
 */
export const ADDITIONAL_ROSTER: (StudentSeed & { batch: string })[] = [];
