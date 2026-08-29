/**
 * Known MCA batches, newest first — the pick-list behind every batch dropdown
 * so the same batch is never typed three different ways ("2024-26" vs "24-26"
 * vs "2024-2026"). Anything outside this list is still accepted: the batch
 * combobox lets the user commit whatever they type into its search field.
 */
export const batchOptions = [
  "2026-28",
  "2025-27",
  "2024-26",
  "2023-25",
  "2022-24",
] as const;

export type BatchOption = (typeof batchOptions)[number];
