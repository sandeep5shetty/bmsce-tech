/**
 * Calculates the score for a correct answer based on remaining time.
 *
 * Formula: max(1, floor(1000 × (remainingTimeMs / timeLimitMs)))
 * Returns 0 for incorrect answers.
 */
export function calculateScore(
  isCorrect: boolean,
  remainingTimeMs: number,
  timeLimitMs: number,
): number {
  if (!isCorrect) return 0;
  return Math.max(1, Math.floor(1000 * (remainingTimeMs / timeLimitMs)));
}
